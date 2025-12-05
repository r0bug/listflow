# eBay Sold Listings Data Access: Comprehensive Technical Guide (2024-2025)

## Executive Summary

Accessing eBay sold listings programmatically has become significantly more restrictive since 2020. The traditional `findCompletedItems` API was fully decommissioned on February 5, 2025. The official replacement (Marketplace Insights API) requires extensive approval processes that most developers cannot access. This document provides a comprehensive overview of current options, including emerging LLM-based automation approaches, legal considerations, and practical alternatives.

## Current State of eBay APIs

### Official APIs Status

#### 1. Marketplace Insights API (Restricted Access)
- **Status**: Limited Release - Partner approval required
- **Data Access**: Sold listings within last 90 days only
- **Endpoint**: `GET /buy/marketplace-insights/v1_beta/item_sales/search`
- **Approval Process**: 
  - eBay Partner Network registration
  - Business model review (10+ business days)
  - Premium support consultation ($75/hour often required)
  - Mutual NDAs and partnership agreements
- **Success Rate**: Many applications rejected without explanation

#### 2. Finding API (Deprecated)
- **Status**: `findCompletedItems` fully decommissioned February 5, 2025
- **Replacement**: Marketplace Insights API (restricted access)
- **Historical Capability**: Up to 15 days of completed listings

#### 3. Browse API
- **Limitation**: Only searches active listings, NOT sold listings
- **Common Misconception**: Often confused as supporting sold data

### Authentication and Rate Limits

```javascript
// OAuth 2.0 Required Scope for Marketplace Insights
const scope = "https://api.ebay.com/oauth/api_scope/buy.marketplace.insights";

// Rate Limits
const limits = {
  newApplications: "5,000 calls/day",
  afterGrowthCheck: "up to 1.5M calls/day",
  oauthTokenGeneration: "5,000 requests/day per grant type"
};
```

## Technical Implementation Examples

### 1. Marketplace Insights API (If Approved)

```python
import requests
import json

class eBayMarketplaceInsights:
    def __init__(self, access_token):
        self.access_token = access_token
        self.base_url = "https://api.ebay.com/buy/marketplace-insights/v1_beta"
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
            'Content-Type': 'application/json'
        }
    
    def search_sold_items(self, keywords, limit=50, price_min=None, price_max=None):
        """
        Search sold listings using Marketplace Insights API
        Note: Requires approved access - most developers cannot use this
        """
        url = f"{self.base_url}/item_sales/search"
        
        params = {
            'q': keywords,
            'limit': min(limit, 200),  # Max 200 per request
            'offset': 0
        }
        
        # Add price filters if specified
        if price_min or price_max:
            price_filter = []
            if price_min:
                price_filter.append(f"price:[{price_min} TO ")
            if price_max:
                price_filter.append(f"{price_max}]")
            params['filter'] = "".join(price_filter)
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return self._parse_response(response.json())
        except requests.exceptions.RequestException as e:
            print(f"API Error: {e}")
            return None
    
    def _parse_response(self, data):
        """Parse and structure the API response"""
        if 'itemSales' not in data:
            return []
        
        results = []
        for item in data['itemSales']:
            results.append({
                'item_id': item.get('itemId'),
                'title': item.get('title'),
                'sold_date': item.get('lastSoldDate'),
                'sold_price': {
                    'value': item.get('lastSoldPrice', {}).get('value'),
                    'currency': item.get('lastSoldPrice', {}).get('currency')
                },
                'quantity_sold': item.get('totalSoldQuantity'),
                'condition': item.get('condition'),
                'location': item.get('itemLocation', {}),
                'seller_feedback': item.get('sellerFeedbackPercentage')
            })
        
        return {
            'items': results,
            'total_found': data.get('total', 0),
            'has_more': data.get('total', 0) > len(results)
        }

# Usage example (requires approved access)
# insights = eBayMarketplaceInsights(your_approved_token)
# sold_data = insights.search_sold_items("vintage watch", limit=100)
```

### 2. Formatted Search URLs (Manual/Limited Automation)

```python
import urllib.parse
from datetime import datetime, timedelta

class eBaySearchURLGenerator:
    """
    Generate eBay search URLs for sold listings
    Note: For manual research or very limited automation only
    """
    
    BASE_URL = "https://www.ebay.com/sch/i.html"
    
    @staticmethod
    def generate_sold_listings_url(
        keywords, 
        price_min=None, 
        price_max=None,
        condition=None,
        sold_days_ago=None,
        items_per_page=200
    ):
        """Generate URL for eBay sold listings search"""
        
        params = {
            '_nkw': keywords,
            'LH_Sold': '1',        # Show sold items
            'LH_Complete': '1',    # Show completed listings
            '_ipg': str(min(items_per_page, 200)),  # Items per page (max 200)
            '_sop': '13'           # Sort by newest first
        }
        
        # Price range filters
        if price_min:
            params['_udlo'] = str(price_min)
        if price_max:
            params['_udhi'] = str(price_max)
        
        # Condition filters
        condition_codes = {
            'new': '1000',
            'open_box': '1500', 
            'refurbished': '2000,2010,2020,2030',
            'used': '3000,4000,5000,6000,7000'
        }
        if condition and condition in condition_codes:
            params['LH_ItemCondition'] = condition_codes[condition]
        
        # Date range (last N days)
        if sold_days_ago:
            params['LH_DAYS_TYPE'] = '1'
            params['LH_DAYS'] = str(sold_days_ago)
        
        # Build URL
        query_string = urllib.parse.urlencode(params)
        return f"{eBaySearchURLGenerator.BASE_URL}?{query_string}"
    
    @staticmethod
    def generate_category_url(category_id, **kwargs):
        """Generate URL for specific category sold listings"""
        url = eBaySearchURLGenerator.generate_sold_listings_url(**kwargs)
        return url + f"&_sacat={category_id}"

# Usage examples
url_generator = eBaySearchURLGenerator()

# Basic search
vintage_watches_url = url_generator.generate_sold_listings_url(
    keywords="vintage rolex",
    price_min=1000,
    price_max=5000,
    sold_days_ago=30
)

# Category-specific search (Watches category: 31387)
watches_category_url = url_generator.generate_category_url(
    category_id=31387,
    keywords="automatic",
    condition="used"
)

print(f"Search URL: {vintage_watches_url}")
```

## LLM-Powered Automation Approaches

### Current Tools and Capabilities

#### 1. Browser Use Framework

```python
# Browser Use - LLM-powered browser automation
import asyncio
from dotenv import load_dotenv
from browser_use import Agent
from langchain_openai import ChatOpenAI

load_dotenv()

class LLMTerapeakAutomation:
    """
    WARNING: This violates eBay's Terms of Service
    For educational/research purposes only
    """
    
    def __init__(self, llm_model="gpt-4o"):
        self.llm = ChatOpenAI(model=llm_model)
    
    async def research_product(self, product_keywords, login_credentials=None):
        """
        EDUCATIONAL EXAMPLE ONLY - DO NOT USE IN PRODUCTION
        This approach violates eBay's Terms of Service
        """
        
        task_description = f"""
        Navigate to eBay Seller Hub and perform product research:
        
        1. Go to ebay.com
        2. Login to seller account (if credentials provided)
        3. Navigate to Seller Hub > Research tab (Product Research)
        4. Search for: "{product_keywords}"
        5. Set date range to last 90 days
        6. Extract the following data:
           - Average sold price
           - Number of items sold
           - Sell-through rate
           - Top selling conditions
           - Price trend information
        7. Return data in structured JSON format
        
        Important: Handle any CAPTCHAs or security challenges appropriately.
        If blocked or detected, stop immediately.
        """
        
        agent = Agent(
            task=task_description,
            llm=self.llm
        )
        
        try:
            result = await agent.run()
            return self._parse_llm_result(result)
        except Exception as e:
            print(f"LLM automation failed: {e}")
            return None
    
    def _parse_llm_result(self, raw_result):
        """Parse and structure LLM automation results"""
        # Implementation would depend on Browser Use output format
        # This is a placeholder for result processing
        return {
            'success': True,
            'data': raw_result,
            'warning': 'This data obtained via ToS violation'
        }

# Cost estimation function
def estimate_llm_automation_costs():
    """Estimate costs for LLM-powered automation"""
    return {
        'gpt4_per_session': '$0.50 - $2.00',
        'claude3_per_session': '$0.30 - $1.50',
        'monthly_heavy_usage': '$50 - $200',
        'development_time': '40-80 hours',
        'risk_assessment': 'Account termination + legal exposure'
    }
```

#### 2. Skyvern Integration

```python
# Skyvern - Computer Vision + LLM automation
import requests
import json

class SkyverneBayAutomation:
    """
    WARNING: Violates eBay ToS - Educational example only
    """
    
    def __init__(self, skyvern_api_key):
        self.api_key = skyvern_api_key
        self.base_url = "https://api.skyvern.com/v1"
    
    def create_research_task(self, product_keywords):
        """
        Create Skyvern task for eBay research
        EDUCATIONAL ONLY - ToS violation
        """
        
        task_payload = {
            "url": "https://www.ebay.com/sh/research",
            "goal": f"Research sold listings for '{product_keywords}' and extract pricing data",
            "data_schema": {
                "type": "object",
                "properties": {
                    "average_price": {"type": "number"},
                    "total_sold": {"type": "integer"},
                    "sell_through_rate": {"type": "number"},
                    "price_range": {
                        "type": "object",
                        "properties": {
                            "min": {"type": "number"},
                            "max": {"type": "number"}
                        }
                    },
                    "trending": {"type": "string"}
                }
            },
            "error_codes_to_stop_on": ["BLOCKED", "CAPTCHA_REQUIRED"]
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/tasks",
                headers=headers,
                json=task_payload
            )
            return response.json()
        except Exception as e:
            print(f"Skyvern task creation failed: {e}")
            return None
```

#### 3. Claude Computer Use Approach

```python
# Conceptual Claude Computer Use integration
class ClaudeComputerUseAutomation:
    """
    Conceptual example of Claude Computer Use for eBay research
    WARNING: Violates eBay ToS
    """
    
    def __init__(self, claude_api_key):
        self.claude_api_key = claude_api_key
    
    def research_with_computer_use(self, search_terms):
        """
        Use Claude's computer use capability for eBay research
        This is a conceptual example - actual implementation
        would require Claude's computer use API
        """
        
        instructions = {
            "task": "eBay Product Research",
            "steps": [
                "Take screenshot of current screen",
                "Open web browser",
                "Navigate to ebay.com",
                "Login to seller account",
                "Click on Seller Hub",
                "Navigate to Research tab",
                f"Search for '{search_terms}'",
                "Set appropriate date filters",
                "Extract pricing and sales data",
                "Take screenshots of results",
                "Compile data into structured format"
            ],
            "output_format": "json",
            "error_handling": "Stop if CAPTCHA or blocking detected"
        }
        
        # This would integrate with Claude's computer use API
        # Actual implementation depends on Anthropic's API structure
        return self._execute_computer_use_task(instructions)
    
    def _execute_computer_use_task(self, instructions):
        """Placeholder for Claude computer use execution"""
        # Implementation would depend on actual Claude computer use API
        pass
```

## Legal and Risk Analysis

### eBay Terms of Service Violations

```markdown
Key ToS Restrictions (effective July 26, 2024):

1. "use any robot, spider, scraper, data mining tools, data gathering 
   and extraction tools, or other automated means to access our Services 
   for any purpose, except with the prior express permission of eBay"

2. Automated access prohibition applies to ALL methods:
   - Traditional web scraping
   - API automation beyond approved limits
   - LLM-powered browser automation
   - Computer vision automation

3. Consequences:
   - Account suspension/termination
   - Legal action and civil lawsuits
   - Permanent platform bans
   - Financial penalties
```

### Detection Methods

```python
# eBay's detection capabilities include:
detection_methods = {
    'request_patterns': {
        'unusual_speed': 'Requests faster than human browsing',
        'volume_analysis': 'High number of requests per session',
        'timing_patterns': 'Too regular or predictable timing'
    },
    'session_monitoring': {
        'rapid_navigation': 'Too quick page transitions',
        'missing_interactions': 'No typical user behaviors (scrolling, etc.)',
        'session_duration': 'Unusually long automated sessions'
    },
    'behavioral_analysis': {
        'mouse_patterns': 'Non-human mouse movements',
        'javascript_execution': 'Missing browser fingerprints',
        'user_agent_analysis': 'Automated tool signatures'
    },
    'advanced_detection': {
        'captcha_systems': 'Automated CAPTCHA challenges',
        'honeypot_links': 'Hidden links that only bots click',
        'rate_limiting': 'Dynamic request throttling',
        'ip_monitoring': 'Multiple accounts from same IP'
    }
}
```

### Risk Assessment Matrix

```python
risk_assessment = {
    'traditional_scraping': {
        'detection_probability': 'Very High (95%+)',
        'account_loss_risk': 'Immediate',
        'legal_risk': 'High',
        'development_effort': 'Medium',
        'recommendation': 'Do not use'
    },
    'llm_automation': {
        'detection_probability': 'High (70-85%)',
        'account_loss_risk': 'High',
        'legal_risk': 'High (same ToS violations)',
        'development_effort': 'High',
        'cost': '$50-200/month + development',
        'recommendation': 'Do not use'
    },
    'manual_research': {
        'detection_probability': 'None',
        'account_loss_risk': 'None',
        'legal_risk': 'None',
        'time_investment': '2-4 hours/week',
        'recommendation': 'Preferred approach'
    },
    'third_party_tools': {
        'detection_probability': 'Low (tools handle compliance)',
        'account_loss_risk': 'Low',
        'legal_risk': 'Low',
        'cost': '$50-500/month',
        'recommendation': 'Best alternative'
    }
}
```

## Alternative Solutions

### 1. Legitimate Third-Party Services

```python
# Third-party eBay research tools
legitimate_alternatives = {
    'zik_analytics': {
        'url': 'https://zikanalytics.com',
        'pricing': '$97-497/month',
        'features': [
            'eBay sold listings analysis',
            'Competitor research',
            'Keyword optimization',
            'Profit calculator',
            'API access available'
        ],
        'api_example': '''
        # ZIK Analytics API integration
        import requests
        
        def get_zik_data(product_name):
            api_key = "your_zik_api_key"
            url = f"https://api.zikanalytics.com/v1/research"
            params = {
                "keyword": product_name,
                "marketplace": "ebay_us",
                "period": "90d"
            }
            headers = {"Authorization": f"Bearer {api_key}"}
            return requests.get(url, params=params, headers=headers).json()
        '''
    },
    'watchcount': {
        'url': 'https://www.watchcount.com',
        'pricing': 'Free tier + paid plans',
        'features': [
            'Auction analysis',
            'Price tracking',
            'Historical data',
            'Market trends'
        ]
    },
    'salehoo': {
        'url': 'https://www.salehoo.com',
        'pricing': '$67/month',
        'features': [
            'Market research lab',
            'eBay integration',
            'Supplier directory',
            'Competition analysis'
        ]
    },
    'autods': {
        'url': 'https://autods.com',
        'pricing': '$1-497/month',
        'features': [
            'Dropshipping focused',
            'eBay integration',
            'Product research',
            'Automated listings'
        ]
    }
}
```

### 2. Official eBay Tools

```python
# Official eBay research tools
official_tools = {
    'product_research': {
        'access': 'Free with Seller Hub account',
        'limitations': [
            'Manual use only',
            'No API access',
            'Limited export options',
            '90-day historical data max'
        ],
        'best_practices': [
            'Use for key product decisions',
            'Document findings externally',
            'Focus on high-value research',
            'Combine with other data sources'
        ]
    },
    'terapeak_sourcing_insights': {
        'access': 'Basic, Premium, Anchor, Enterprise eBay Stores',
        'cost': '$12/month for Starter Store subscribers',
        'features': [
            'Supply and demand analysis',
            'Category performance metrics',
            'Sourcing recommendations'
        ]
    }
}
```

### 3. Data Export and Management

```python
class LegitimateResearchWorkflow:
    """
    Recommended workflow for eBay product research
    using only legitimate methods
    """
    
    def __init__(self):
        self.research_data = []
    
    def manual_research_template(self, product_keyword):
        """Template for manual research documentation"""
        return {
            'timestamp': datetime.now().isoformat(),
            'product': product_keyword,
            'research_method': 'manual_product_research',
            'data_source': 'ebay_product_research_tool',
            'findings': {
                'average_price': None,  # Fill manually
                'sales_volume': None,   # Fill manually
                'sell_through_rate': None,  # Fill manually
                'competition_level': None,   # Fill manually
                'trend_direction': None,     # Fill manually
                'seasonal_patterns': None,   # Fill manually
                'notes': ""
            },
            'next_research_date': None,
            'action_items': []
        }
    
    def export_research_data(self, format='json'):
        """Export collected research data"""
        if format == 'json':
            return json.dumps(self.research_data, indent=2)
        elif format == 'csv':
            return self._to_csv()
    
    def _to_csv(self):
        """Convert research data to CSV format"""
        # Implementation for CSV export
        pass
    
    def schedule_research(self, products, frequency='weekly'):
        """Create research schedule for multiple products"""
        schedule = []
        for product in products:
            schedule.append({
                'product': product,
                'frequency': frequency,
                'last_researched': None,
                'next_due': None,
                'priority': 'medium'
            })
        return schedule
```

## Cost-Benefit Analysis

### Comprehensive Cost Comparison

```python
cost_analysis = {
    'llm_automation_attempt': {
        'development_costs': {
            'developer_time': '40-80 hours @ $50-150/hr = $2,000-12,000',
            'llm_api_costs': '$50-200/month ongoing',
            'infrastructure': '$20-100/month',
            'maintenance': '5-10 hours/month @ $50-150/hr'
        },
        'risk_costs': {
            'account_termination': 'Potentially $1,000s in lost business',
            'legal_exposure': 'Unknown but potentially significant',
            'reputation_damage': 'Difficult to quantify'
        },
        'total_first_year': '$3,000-15,000+ (plus significant risk)',
        'success_probability': '15-30% (high detection rate)'
    },
    
    'legitimate_alternatives': {
        'zik_analytics_pro': {
            'cost': '$497/month = $5,964/year',
            'features': 'Full research suite + API',
            'risk': 'None',
            'setup_time': '2-4 hours'
        },
        'manual_research': {
            'cost': '4 hours/week @ $25/hr = $5,200/year',
            'features': 'Complete flexibility',
            'risk': 'None',
            'learning_curve': 'Minimal'
        },
        'hybrid_approach': {
            'cost': 'ZIK Basic ($97/month) + manual = $2,364/year',
            'features': 'Good coverage for most needs',
            'risk': 'None',
            'efficiency': 'High'
        }
    },
    
    'recommendation': {
        'best_roi': 'Hybrid approach (ZIK Basic + manual research)',
        'reasoning': [
            'Lower cost than automation attempt',
            'Zero legal/account risk',
            'Proven reliability',
            'Scales with business growth',
            'No detection concerns'
        ]
    }
}
```

## Implementation Recommendations

### Recommended Workflow

```python
class RecommendedeBayResearchStrategy:
    """
    Recommended approach for eBay product research
    combining legitimate tools and manual research
    """
    
    def __init__(self):
        self.tools = self._initialize_tools()
    
    def _initialize_tools(self):
        return {
            'primary': 'ebay_product_research',  # Built-in tool
            'secondary': 'zik_analytics_basic',  # Third-party
            'manual_verification': True,
            'documentation': 'structured_spreadsheet'
        }
    
    def research_product(self, keyword, depth='standard'):
        """
        Execute comprehensive product research
        """
        research_plan = {
            'phase_1_quick_check': [
                'Use eBay Product Research for initial overview',
                'Check basic metrics: avg price, sales volume',
                'Identify immediate red flags'
            ],
            'phase_2_deep_dive': [
                'Use ZIK Analytics for competitor analysis',
                'Analyze seasonal trends',
                'Research similar products',
                'Calculate profit margins'
            ],
            'phase_3_validation': [
                'Manual verification of key findings',
                'Cross-reference with multiple sources',
                'Document assumptions and limitations'
            ],
            'phase_4_decision': [
                'Compile findings into decision matrix',
                'Set monitoring schedule',
                'Define success metrics'
            ]
        }
        
        if depth == 'quick':
            return research_plan['phase_1_quick_check']
        elif depth == 'comprehensive':
            return research_plan
        else:
            return [research_plan['phase_1_quick_check'], 
                   research_plan['phase_2_deep_dive']]
    
    def monitoring_schedule(self):
        """
        Set up ongoing monitoring for researched products
        """
        return {
            'high_priority_products': 'weekly_check',
            'medium_priority_products': 'bi_weekly_check',
            'low_priority_products': 'monthly_check',
            'seasonal_products': 'trend_based_monitoring',
            'tools_to_use': [
                'eBay Product Research',
                'ZIK Analytics alerts',
                'Manual spot checks'
            ]
        }
```

### Best Practices Summary

```markdown
## DO's and DON'Ts for eBay Research

### DO:
✅ Use eBay's official Product Research tool manually
✅ Invest in legitimate third-party research services
✅ Document your research systematically
✅ Combine multiple data sources for validation
✅ Respect eBay's Terms of Service
✅ Focus on high-value research decisions
✅ Set up regular monitoring schedules
✅ Consider official eBay partnerships for large-scale needs

### DON'T:
❌ Attempt any form of automated data extraction
❌ Use LLM automation despite sophistication
❌ Scrape eBay pages with any tools
❌ Violate Terms of Service for competitive advantage
❌ Risk valuable seller accounts for data access
❌ Ignore legal implications of automation
❌ Assume "smarter" automation avoids detection
❌ Underestimate eBay's detection capabilities
```

## Future Considerations

### Industry Trends

```python
future_outlook = {
    'api_access_trends': {
        'direction': 'Increasingly restrictive',
        'timeline': '2024-2026',
        'implications': [
            'More APIs moving to partner-only access',
            'Higher barriers to entry for developers',
            'Greater emphasis on official partnerships'
        ]
    },
    'llm_automation_evolution': {
        'capabilities': 'Rapidly improving',
        'detection_evolution': 'Also rapidly improving',
        'arms_race': 'Ongoing between automation and detection',
        'legal_clarity': 'Likely to become more restrictive'
    },
    'legitimate_alternatives': {
        'market_growth': 'Expanding rapidly',
        'feature_improvement': 'AI-powered insights becoming standard',
        'cost_trends': 'Becoming more competitive',
        'integration_options': 'Better API access from third parties'
    }
}
```

### Monitoring Regulatory Changes

```python
def monitor_ebay_policy_changes():
    """
    Recommended monitoring for eBay policy changes
    """
    monitoring_strategy = {
        'sources_to_watch': [
            'eBay Developer Program announcements',
            'eBay Seller Updates newsletters',
            'eBay Community forums',
            'Third-party service provider updates'
        ],
        'key_indicators': [
            'API deprecation notices',
            'Terms of Service updates',
            'New partnership opportunities',
            'Detection system improvements'
        ],
        'response_plan': [
            'Evaluate impact on current workflows',
            'Assess alternative approaches',
            'Update compliance procedures',
            'Consider partnership applications if viable'
        ]
    }
    return monitoring_strategy
```

## Conclusion

The landscape for eBay sold listings data access has fundamentally shifted toward restriction and partner-only access. While LLM-powered automation represents a technical advancement, it does not resolve the legal and business risks associated with violating platform Terms of Service.

### Key Takeaways:

1. **Official Access is Limited**: Marketplace Insights API requires extensive approval that most developers cannot obtain
2. **LLM Automation Doesn't Change Legal Issues**: Sophisticated automation methods still violate eBay's Terms of Service
3. **Detection Systems are Advanced**: eBay actively monitors and blocks automated access attempts
4. **Legitimate Alternatives Exist**: Third-party services provide comprehensive research capabilities without risk
5. **Cost-Benefit Favors Compliance**: Legal alternatives are more cost-effective than risky automation attempts

### Recommended Path Forward:

1. Use eBay's Product Research tool manually for critical decisions
2. Invest in legitimate third-party research services (ZIK Analytics, etc.)
3. Develop systematic manual research workflows
4. Consider official partnership inquiries for large-scale needs
5. Focus development resources on core business value rather than platform circumvention

The most successful approach combines official tools, legitimate third-party services, and systematic manual research processes that scale with business growth while maintaining full compliance with platform policies.

---

*This document represents research conducted in December 2024 - June 2025. eBay policies and API availability may change. Always consult current eBay Developer documentation and Terms of Service before implementing any data access strategy.*