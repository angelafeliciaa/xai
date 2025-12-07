# UGC Platform for X

A minimalistic User-Generated Content platform for brands to create and manage influencer campaigns.

## Features

- **Clean Apple-style Design** - Minimalistic UI with Hanken Grotesk font
- **Multi-step Campaign Creation** - 5-step workflow for creating campaigns
- **Product Management** - Add and manage products for campaigns
- **Campaign Management** - View and manage all your campaigns
- **Creator Preferences** - Filter creators by age, location, gender, ethnicity, and more
- **Asset Requirements** - Specify deliverables and content guidelines
- **Inbox System** - Communicate with creators

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first CSS framework
- **Hanken Grotesk** - Google Font for modern typography

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Campaign Creation Flow

The platform includes a 5-step campaign creation process:

1. **Campaign** - Set basic details, campaign type, and brand
2. **Product** - Select product and configure delivery options
3. **Creators** - Define ideal creator preferences
4. **Assets** - Specify content requirements and deliverables
5. **Review** - Review and publish your campaign

## Pages

- `/` - Dashboard home
- `/campaigns` - Campaign list
- `/campaigns/new` - Create new campaign
- `/inbox` - Messages and notifications
- `/brands` - Manage brands
- `/products` - Manage products
- `/assets` - Asset library
- `/creators` - Find creators
- `/settings` - Account settings

## Design Philosophy

This platform follows Apple's design principles:
- Minimalistic and clean interface
- Ample white space
- Clear typography hierarchy
- Subtle interactions and transitions
- Focus on content and functionality
