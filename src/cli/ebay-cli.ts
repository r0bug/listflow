#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { PrismaClient, WorkflowStage, UserRole } from '../../src/generated/prisma';
import { workflowService } from '../services/workflow.service';
import { aiService } from '../services/ai.service';
import { soldDataService } from '../services/soldData.service';
import { ebayService } from '../services/ebay.service';
import { cleanupService } from '../services/cleanup.service';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const program = new Command();

// Session management
const SESSION_FILE = path.join(process.env.HOME || '.', '.consoleebay-session.json');

interface Session {
  userId: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: number;
}

async function saveSession(session: Session): Promise<void> {
  await fs.writeFile(SESSION_FILE, JSON.stringify(session, null, 2));
}

async function loadSession(): Promise<Session | null> {
  try {
    const data = await fs.readFile(SESSION_FILE, 'utf-8');
    const session = JSON.parse(data) as Session;

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      await clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

async function clearSession(): Promise<void> {
  try {
    await fs.unlink(SESSION_FILE);
  } catch {
    // Ignore errors
  }
}

async function requireAuth(): Promise<Session> {
  const session = await loadSession();
  if (!session) {
    console.log(chalk.red('\nYou must be logged in to use this command.'));
    console.log(chalk.gray('Run: ebay-cli login'));
    process.exit(1);
  }
  return session;
}

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

    // Check if already logged in
    const existingSession = await loadSession();
    if (existingSession) {
      const { useExisting } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useExisting',
          message: `Already logged in as ${existingSession.email}. Continue with this session?`,
          default: true
        }
      ]);

      if (useExisting) {
        console.log(chalk.green(`\nContinuing as ${existingSession.email}`));
        return;
      }
    }

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

    const spinner = ora('Authenticating...').start();

    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        spinner.fail('Invalid email or password');
        return;
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        spinner.fail('Invalid email or password');
        return;
      }

      // Generate JWT token
      const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
      const expiresIn = 24 * 60 * 60 * 1000; // 24 hours
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        secret,
        { expiresIn: '24h' }
      );

      // Save session
      const session: Session = {
        userId: user.id,
        email: user.email,
        role: user.role,
        token,
        expiresAt: Date.now() + expiresIn
      };
      await saveSession(session);

      // Update user's online status
      await prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastActive: new Date() }
      });

      spinner.succeed(`Logged in as ${email} (${user.role})`);
    } catch (error: any) {
      spinner.fail(`Login failed: ${error.message}`);
    }
  });

program
  .command('logout')
  .description('Logout from the system')
  .action(async () => {
    const session = await loadSession();
    if (session) {
      // Update user's online status
      try {
        await prisma.user.update({
          where: { id: session.userId },
          data: { isOnline: false }
        });
      } catch {
        // Ignore errors
      }
    }
    await clearSession();
    console.log(chalk.green('Logged out successfully'));
  });

program
  .command('whoami')
  .description('Show current logged in user')
  .action(async () => {
    const session = await loadSession();
    if (session) {
      console.log(chalk.cyan(`\nLogged in as: ${session.email}`));
      console.log(chalk.gray(`Role: ${session.role}`));
      console.log(chalk.gray(`Session expires: ${new Date(session.expiresAt).toLocaleString()}`));
    } else {
      console.log(chalk.yellow('Not logged in'));
    }
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

// Sold Data Commands
const soldCommand = program
  .command('sold')
  .description('eBay sold data research commands');

soldCommand
  .command('search <query>')
  .description('Search eBay sold listings for pricing research')
  .option('-p, --pages <number>', 'Max pages to scrape (default: 2)', '2')
  .option('--no-headless', 'Show browser window during scraping')
  .action(async (query: string, options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.blue(`\nSearching sold items for: "${query}"\n`));

    const spinner = ora('Initializing browser...').start();

    try {
      const items = await soldDataService.searchSoldItems(query, {
        maxPages: parseInt(options.pages) || 2,
        headless: options.headless !== false,
        saveToDb: true
      });

      spinner.succeed(`Found ${items.length} sold items`);

      if (items.length === 0) {
        console.log(chalk.yellow('No sold items found for this search.'));
        return;
      }

      // Display results in table
      const table = new Table({
        head: ['Title', 'Price', 'Shipping', 'Total', 'Condition', 'Sold Date'],
        colWidths: [40, 10, 10, 10, 15, 15]
      });

      items.slice(0, 20).forEach(item => {
        table.push([
          item.title.substring(0, 38) + (item.title.length > 38 ? '..' : ''),
          `$${item.soldPrice.toFixed(2)}`,
          item.shippingPrice !== undefined ? `$${item.shippingPrice.toFixed(2)}` : 'N/A',
          item.totalPrice ? `$${item.totalPrice.toFixed(2)}` : 'N/A',
          item.condition?.substring(0, 13) || 'N/A',
          new Date(item.soldDate).toLocaleDateString()
        ]);
      });

      console.log(table.toString());

      if (items.length > 20) {
        console.log(chalk.gray(`\n... and ${items.length - 20} more items (saved to database)`));
      }

      // Show price statistics
      const prices = items.map(i => i.totalPrice || i.soldPrice).sort((a, b) => a - b);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const median = prices[Math.floor(prices.length / 2)];

      console.log(chalk.green('\nPrice Statistics:'));
      console.log(`  Average: $${avg.toFixed(2)}`);
      console.log(`  Median:  $${median.toFixed(2)}`);
      console.log(`  Low:     $${prices[0].toFixed(2)}`);
      console.log(`  High:    $${prices[prices.length - 1].toFixed(2)}`);

    } catch (error: any) {
      spinner.fail(`Error: ${error.message}`);
    } finally {
      await soldDataService.close();
    }
  });

soldCommand
  .command('price <title>')
  .description('Get suggested pricing for an item based on sold data')
  .option('-c, --condition <condition>', 'Item condition')
  .action(async (title: string, options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.blue(`\nGetting price suggestion for: "${title}"\n`));

    const spinner = ora('Analyzing market data...').start();

    try {
      const suggestion = await soldDataService.getSuggestedPrice(title, options.condition);

      spinner.succeed('Price analysis complete');

      console.log(chalk.green('\nSuggested Pricing:'));
      console.log(`  Starting Price:  $${suggestion.suggestedStartPrice.toFixed(2)}`);
      console.log(`  Buy It Now:      $${suggestion.suggestedBuyNowPrice.toFixed(2)}`);
      console.log(`  Price Range:     $${suggestion.priceRange.min.toFixed(2)} - $${suggestion.priceRange.max.toFixed(2)}`);
      console.log(`  Confidence:      ${suggestion.confidence.toUpperCase()}`);
      console.log(`  Based on:        ${suggestion.basedOn} comparable sales`);

      if (suggestion.confidence === 'low') {
        console.log(chalk.yellow('\nNote: Low confidence due to limited sales data. Consider manual research.'));
      }

    } catch (error: any) {
      spinner.fail(`Error: ${error.message}`);
    } finally {
      await soldDataService.close();
    }
  });

soldCommand
  .command('history')
  .description('View recently scraped sold items from database')
  .option('-q, --query <query>', 'Filter by search query')
  .option('-l, --limit <number>', 'Limit results (default: 20)', '20')
  .option('--min <price>', 'Minimum price filter')
  .option('--max <price>', 'Maximum price filter')
  .action(async (options) => {
    console.log(chalk.cyan(banner));

    try {
      const items = await soldDataService.getRecentSoldItems({
        query: options.query,
        limit: parseInt(options.limit) || 20,
        minPrice: options.min ? parseFloat(options.min) : undefined,
        maxPrice: options.max ? parseFloat(options.max) : undefined
      });

      if (items.length === 0) {
        console.log(chalk.yellow('\nNo sold items in database matching criteria.'));
        console.log(chalk.gray('Run "ebay-cli sold search <query>" to fetch data.'));
        return;
      }

      console.log(chalk.blue(`\nRecent Sold Items (${items.length}):\n`));

      const table = new Table({
        head: ['Title', 'Price', 'Condition', 'Sold Date'],
        colWidths: [50, 12, 15, 15]
      });

      items.forEach(item => {
        table.push([
          item.title.substring(0, 48) + (item.title.length > 48 ? '..' : ''),
          `$${item.soldPrice.toFixed(2)}`,
          item.condition?.substring(0, 13) || 'N/A',
          new Date(item.soldDate).toLocaleDateString()
        ]);
      });

      console.log(table.toString());

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

// My Sales Commands (using eBay API for your own sales)
const myCommand = program
  .command('my')
  .description('View your eBay account data');

myCommand
  .command('sales')
  .description('View your recent sales (requires eBay API credentials)')
  .option('-d, --days <number>', 'Days to look back (default: 30)', '30')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.blue('\nFetching your recent sales...\n'));

    try {
      const transactions = await ebayService.getSellerTransactions({
        daysBack: parseInt(options.days) || 30
      });

      if (transactions.length === 0) {
        console.log(chalk.yellow('No sales found in the specified period.'));
        console.log(chalk.gray('Note: Make sure eBay API credentials are configured.'));
        return;
      }

      const table = new Table({
        head: ['Item', 'Qty', 'Price', 'Fee', 'Net', 'Sold Date'],
        colWidths: [35, 5, 10, 8, 10, 15]
      });

      let totalSales = 0;
      let totalFees = 0;

      transactions.forEach(tx => {
        const net = tx.soldPrice - tx.finalValueFee;
        totalSales += tx.soldPrice * tx.quantitySold;
        totalFees += tx.finalValueFee;

        table.push([
          tx.title.substring(0, 33) + (tx.title.length > 33 ? '..' : ''),
          tx.quantitySold.toString(),
          `$${tx.soldPrice.toFixed(2)}`,
          `$${tx.finalValueFee.toFixed(2)}`,
          `$${net.toFixed(2)}`,
          tx.soldDate ? new Date(tx.soldDate).toLocaleDateString() : 'N/A'
        ]);
      });

      console.log(table.toString());

      console.log(chalk.green('\nSummary:'));
      console.log(`  Total Sales:  $${totalSales.toFixed(2)}`);
      console.log(`  Total Fees:   $${totalFees.toFixed(2)}`);
      console.log(`  Net Revenue:  $${(totalSales - totalFees).toFixed(2)}`);
      console.log(`  Transactions: ${transactions.length}`);

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

myCommand
  .command('active')
  .description('View your active listings')
  .action(async () => {
    console.log(chalk.cyan(banner));
    console.log(chalk.blue('\nFetching your active listings...\n'));

    try {
      const listings = await ebayService.getMyActiveListings();

      if (listings.length === 0) {
        console.log(chalk.yellow('No active listings found.'));
        return;
      }

      const table = new Table({
        head: ['Item', 'Price', 'Bids', 'Watch', 'Type', 'Ends'],
        colWidths: [40, 10, 6, 7, 12, 15]
      });

      listings.forEach(item => {
        table.push([
          item.title.substring(0, 38) + (item.title.length > 38 ? '..' : ''),
          `$${item.currentPrice.toFixed(2)}`,
          item.bidCount.toString(),
          item.watchCount.toString(),
          item.listingType,
          item.endTime ? new Date(item.endTime).toLocaleDateString() : 'N/A'
        ]);
      });

      console.log(table.toString());
      console.log(chalk.gray(`\nTotal active listings: ${listings.length}`));

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

// Cleanup Commands
const cleanupCommand = program
  .command('cleanup')
  .description('System cleanup and maintenance commands');

cleanupCommand
  .command('storage')
  .description('View storage usage statistics')
  .action(async () => {
    console.log(chalk.cyan(banner));
    console.log(chalk.blue('\nStorage Statistics:\n'));

    try {
      const stats = await cleanupService.getStorageStats();

      console.log(`  Total Files:     ${stats.fileCount}`);
      console.log(`  Uploads Size:    ${formatBytes(stats.uploadsSize)}`);
      console.log(`  Optimized Size:  ${formatBytes(stats.optimizedSize)}`);
      console.log(`  Total Size:      ${formatBytes(stats.totalSize)}`);

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

cleanupCommand
  .command('orphans')
  .description('Clean up orphaned files not in database')
  .option('--dry-run', 'Show what would be deleted without deleting')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.blue(`\n${options.dryRun ? '[DRY RUN] ' : ''}Cleaning orphaned files...\n`));

    const spinner = ora('Scanning files...').start();

    try {
      const stats = await cleanupService.cleanupOrphanedFiles({
        dryRun: options.dryRun,
        verbose: true
      });

      spinner.succeed('Cleanup complete');

      console.log(chalk.green('\nResults:'));
      console.log(`  Files scanned:  ${stats.filesScanned}`);
      console.log(`  Files deleted:  ${stats.filesDeleted}`);
      console.log(`  Space freed:    ${formatBytes(stats.bytesFreed)}`);

      if (stats.errors.length > 0) {
        console.log(chalk.yellow(`\nErrors (${stats.errors.length}):`));
        stats.errors.slice(0, 5).forEach(e => console.log(`  - ${e}`));
      }

    } catch (error: any) {
      spinner.fail(`Error: ${error.message}`);
    }
  });

cleanupCommand
  .command('old')
  .description('Clean up files older than specified days')
  .option('-d, --days <number>', 'Delete files older than this many days', '90')
  .option('--dry-run', 'Show what would be deleted without deleting')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.blue(`\n${options.dryRun ? '[DRY RUN] ' : ''}Cleaning files older than ${options.days} days...\n`));

    const spinner = ora('Scanning files...').start();

    try {
      const stats = await cleanupService.cleanupOldFiles({
        dryRun: options.dryRun,
        maxAgeDays: parseInt(options.days),
        verbose: true
      });

      spinner.succeed('Cleanup complete');

      console.log(chalk.green('\nResults:'));
      console.log(`  Files scanned:  ${stats.filesScanned}`);
      console.log(`  Files deleted:  ${stats.filesDeleted}`);
      console.log(`  Space freed:    ${formatBytes(stats.bytesFreed)}`);

    } catch (error: any) {
      spinner.fail(`Error: ${error.message}`);
    }
  });

cleanupCommand
  .command('all')
  .description('Run full system cleanup')
  .option('--dry-run', 'Show what would be deleted without deleting')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.blue(`\n${options.dryRun ? '[DRY RUN] ' : ''}Running full system cleanup...\n`));

    try {
      const results = await cleanupService.runFullCleanup({
        dryRun: options.dryRun
      });

      console.log(chalk.green('\nFull cleanup complete!'));

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

// Helper function for formatting bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Parse arguments and execute
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}