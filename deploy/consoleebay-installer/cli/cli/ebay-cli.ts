#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { PrismaClient, WorkflowStage, UserRole } from '../../src/generated/prisma';
import { workflowService } from '../services/workflow.service';
import { aiService } from '../services/ai.service';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const program = new Command();

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════╗
║     ConsoleEbay CLI Tool v1.0.0      ║
║   AI-Powered eBay Listing Processor  ║
╚═══════════════════════════════════════╝
`;

// Helper function to display items in a table
function displayItems(items: any[]) {
  const table = new Table({
    head: ['ID', 'SKU', 'Title', 'Stage', 'Status', 'Created'],
    colWidths: [10, 15, 30, 15, 10, 20]
  });

  items.forEach(item => {
    table.push([
      item.id.substring(0, 8),
      item.sku || 'N/A',
      item.title ? item.title.substring(0, 28) + '...' : 'No title',
      item.stage,
      item.status,
      new Date(item.createdAt).toLocaleDateString()
    ]);
  });

  console.log(table.toString());
}

// Process items interactively
async function processItems(userId: string, role: UserRole) {
  console.clear();
  console.log(chalk.cyan(banner));
  
  let continueProcessing = true;
  
  while (continueProcessing) {
    // Get next item for user
    const nextItem = await workflowService.getNextItemForUser(userId);
    
    if (!nextItem) {
      console.log(chalk.yellow('\nNo items in your queue.'));
      break;
    }
    
    console.log(chalk.green(`\n📦 Processing Item: ${nextItem.id.substring(0, 8)}`));
    console.log(chalk.gray(`Stage: ${nextItem.stage}`));
    console.log(chalk.gray(`Created: ${new Date(nextItem.createdAt).toLocaleString()}`));
    
    // Display item details based on stage
    switch (nextItem.stage) {
      case WorkflowStage.REVIEW_EDIT:
        console.log('\n' + chalk.blue('AI Generated Content:'));
        console.log(`Title: ${nextItem.title || 'Not generated'}`);
        console.log(`Brand: ${nextItem.brand || 'Unknown'}`);
        console.log(`Condition: ${nextItem.condition || 'Unknown'}`);
        console.log(`Category: ${nextItem.category || 'Unknown'}`);
        console.log(`Features: ${nextItem.features?.join(', ') || 'None'}`);
        console.log(`\nDescription:\n${nextItem.description || 'Not generated'}`);
        break;
        
      case WorkflowStage.PRICING:
        console.log('\n' + chalk.blue('Item Details:'));
        console.log(`Title: ${nextItem.title}`);
        console.log(`Condition: ${nextItem.condition}`);
        console.log(`Category: ${nextItem.category}`);
        break;
        
      case WorkflowStage.FINAL_REVIEW:
        console.log('\n' + chalk.blue('Complete Listing:'));
        console.log(`Title: ${nextItem.title}`);
        console.log(`Price: $${nextItem.startingPrice || 0}`);
        console.log(`Buy Now: $${nextItem.buyNowPrice || 0}`);
        console.log(`Shipping: $${nextItem.shippingCost || 0}`);
        break;
    }
    
    // Action menu
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: getActionChoices(nextItem.stage, role)
      }
    ]);
    
    const spinner = ora();
    
    switch (action) {
      case 'approve':
        spinner.start('Moving to next stage...');
        try {
          await workflowService.moveToNextStage(userId, nextItem.id);
          spinner.succeed('Item advanced to next stage');
        } catch (error: any) {
          spinner.fail(`Error: ${error.message}`);
        }
        break;
        
      case 'edit':
        await editItem(nextItem, userId);
        break;
        
      case 'price':
        await setItemPricing(nextItem, userId);
        break;
        
      case 'reject':
        const { reason } = await inquirer.prompt([
          {
            type: 'input',
            name: 'reason',
            message: 'Rejection reason:',
            validate: (input) => input.length > 0 || 'Reason is required'
          }
        ]);
        
        spinner.start('Rejecting item...');
        try {
          await workflowService.rejectItem(userId, nextItem.id, reason);
          spinner.succeed('Item rejected');
        } catch (error: any) {
          spinner.fail(`Error: ${error.message}`);
        }
        break;
        
      case 'skip':
        console.log(chalk.gray('Skipping to next item...'));
        break;
        
      case 'quit':
        continueProcessing = false;
        break;
    }
    
    if (action !== 'quit' && continueProcessing) {
      const { continueChoice } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueChoice',
          message: 'Process next item?',
          default: true
        }
      ]);
      
      continueProcessing = continueChoice;
    }
  }
  
  console.log(chalk.cyan('\nSession ended. Goodbye! 👋'));
}

// Get action choices based on stage and role
function getActionChoices(stage: WorkflowStage, role: UserRole) {
  const choices = [];
  
  switch (stage) {
    case WorkflowStage.REVIEW_EDIT:
      choices.push(
        { name: '✅ Approve and advance', value: 'approve' },
        { name: '✏️  Edit content', value: 'edit' },
        { name: '❌ Reject', value: 'reject' }
      );
      break;
      
    case WorkflowStage.PRICING:
      choices.push(
        { name: '💰 Set pricing', value: 'price' },
        { name: '⬅️  Send back for revision', value: 'reject' }
      );
      break;
      
    case WorkflowStage.FINAL_REVIEW:
      choices.push(
        { name: '🚀 Publish to eBay', value: 'approve' },
        { name: '⬅️  Send back for revision', value: 'reject' }
      );
      break;
      
    default:
      choices.push({ name: '➡️  Process', value: 'approve' });
  }
  
  choices.push(
    { name: '⏭️  Skip to next item', value: 'skip' },
    { name: '🚪 Quit', value: 'quit' }
  );
  
  return choices;
}

// Edit item content
async function editItem(item: any, userId: string) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Title (80 chars max):',
      default: item.title,
      validate: (input) => input.length <= 80 || 'Title must be 80 characters or less'
    },
    {
      type: 'editor',
      name: 'description',
      message: 'Description (press Enter to open editor):',
      default: item.description
    },
    {
      type: 'input',
      name: 'brand',
      message: 'Brand:',
      default: item.brand
    },
    {
      type: 'list',
      name: 'condition',
      message: 'Condition:',
      choices: [
        'new', 'new-other', 'refurbished', 
        'used-like-new', 'used-very-good', 
        'used-good', 'used-acceptable', 'for-parts'
      ],
      default: item.condition
    },
    {
      type: 'input',
      name: 'keywords',
      message: 'Keywords (comma separated):',
      default: item.keywords?.join(', ')
    }
  ]);
  
  const spinner = ora('Saving changes...').start();
  
  try {
    await workflowService.moveToNextStage(userId, item.id, 'Edited content', {
      title: answers.title,
      description: answers.description,
      brand: answers.brand,
      condition: answers.condition,
      keywords: answers.keywords.split(',').map((k: string) => k.trim())
    });
    spinner.succeed('Changes saved and item advanced');
  } catch (error: any) {
    spinner.fail(`Error: ${error.message}`);
  }
}

// Set item pricing
async function setItemPricing(item: any, userId: string) {
  console.log(chalk.blue('\n💰 Manual Pricing'));
  console.log(chalk.gray('Note: Automated pricing is disabled. Please research comparable items on eBay.'));
  
  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'startingPrice',
      message: 'Starting price ($):',
      default: item.startingPrice || 9.99,
      validate: (input) => input > 0 || 'Price must be greater than 0'
    },
    {
      type: 'number',
      name: 'buyNowPrice',
      message: 'Buy It Now price ($):',
      default: item.buyNowPrice || 29.99,
      validate: (input) => input > 0 || 'Price must be greater than 0'
    },
    {
      type: 'number',
      name: 'shippingCost',
      message: 'Shipping cost ($):',
      default: item.shippingCost || 7.99,
      validate: (input) => input >= 0 || 'Shipping cost must be 0 or greater'
    }
  ]);
  
  const spinner = ora('Saving pricing...').start();
  
  try {
    await workflowService.moveToNextStage(userId, item.id, 'Pricing set', answers);
    spinner.succeed('Pricing saved and item advanced to final review');
  } catch (error: any) {
    spinner.fail(`Error: ${error.message}`);
  }
}

// CLI Commands
program
  .name('ebay-cli')
  .description('ConsoleEbay CLI - Process eBay listings from the command line')
  .version('1.0.0');

program
  .command('login')
  .description('Login to the system')
  .action(async () => {
    console.log(chalk.cyan(banner));
    
    const { email, password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input) => input.includes('@') || 'Please enter a valid email'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*'
      }
    ]);
    
    // TODO: Implement actual authentication
    console.log(chalk.green(`\nLogged in as ${email}`));
  });

program
  .command('process')
  .description('Start processing items in your queue')
  .option('-u, --user <userId>', 'User ID')
  .option('-r, --role <role>', 'User role')
  .action(async (options) => {
    // For testing, use provided user ID or create a test user
    const userId = options.user || 'test-user-id';
    const role = options.role || UserRole.PROCESSOR;
    
    await processItems(userId, role);
  });

program
  .command('stats')
  .description('View workflow statistics')
  .action(async () => {
    console.log(chalk.cyan(banner));
    
    const stats = await prisma.item.groupBy({
      by: ['stage'],
      _count: { id: true }
    });
    
    console.log(chalk.blue('\n📊 Workflow Statistics:\n'));
    
    const table = new Table({
      head: ['Stage', 'Count'],
      colWidths: [25, 10]
    });
    
    stats.forEach(stat => {
      table.push([stat.stage, stat._count.id.toString()]);
    });
    
    console.log(table.toString());
    
    const total = await prisma.item.count();
    console.log(chalk.green(`\nTotal items: ${total}`));
  });

program
  .command('list')
  .description('List items by stage')
  .option('-s, --stage <stage>', 'Filter by stage')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    
    const where = options.stage ? { stage: options.stage } : {};
    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    if (items.length === 0) {
      console.log(chalk.yellow('\nNo items found.'));
    } else {
      console.log(chalk.blue(`\n📦 Items${options.stage ? ` in ${options.stage}` : ''}:\n`));
      displayItems(items);
    }
  });

program
  .command('create')
  .description('Create a new item')
  .action(async () => {
    console.log(chalk.cyan(banner));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'sku',
        message: 'SKU (optional):'
      },
      {
        type: 'input',
        name: 'photoPath',
        message: 'Photo path (or press Enter to skip):'
      }
    ]);
    
    const spinner = ora('Creating item...').start();
    
    try {
      // Create a test user if needed
      let user = await prisma.user.findFirst({
        where: { role: UserRole.PHOTOGRAPHER }
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'photographer@test.com',
            name: 'Test Photographer',
            role: UserRole.PHOTOGRAPHER,
            password: 'test' // In production, hash this
          }
        });
      }
      
      const item = await prisma.item.create({
        data: {
          sku: answers.sku || undefined,
          stage: WorkflowStage.PHOTO_UPLOAD,
          createdById: user.id
        }
      });
      
      if (answers.photoPath) {
        await prisma.photo.create({
          data: {
            itemId: item.id,
            originalPath: answers.photoPath,
            isPrimary: true
          }
        });
      }
      
      spinner.succeed(`Item created: ${item.id.substring(0, 8)}`);
    } catch (error: any) {
      spinner.fail(`Error: ${error.message}`);
    }
  });

// Parse arguments and execute
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}