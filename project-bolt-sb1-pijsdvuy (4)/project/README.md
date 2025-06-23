# 🍪 Cookie Business Dashboard

A comprehensive, professional-grade business management dashboard specifically designed for cookie businesses. Built with React, TypeScript, and modern web technologies.

## ✨ Features

### 📊 **Advanced Analytics & Statistics**
- **Multi-channel sales tracking** (In-store, Uber Eats, Wolt, Lieferando, Website)
- **Interactive charts** with Recharts integration
- **PDF & Excel exports** with chart visualization
- **Real-time revenue calculations**
- **Profit margin analysis**

### 🏪 **Multi-Platform Sales Management**
- Track sales across 5+ platforms
- Employee consumption tracking
- Daily revenue summaries
- Platform-specific analytics

### 📈 **Production & Inventory**
- **Recipe management** with ingredient tracking
- **Automatic ingredient consumption** during production
- **Inventory auditing** with multi-location support
- **Low stock warnings** and shopping lists
- **Production planning** and cost calculation

### 👥 **User Management & Permissions**
- **Role-based access control** (Admin/Employee)
- **Granular permissions** for different features
- **Secure login system** with user activity tracking
- **Multi-user support**

### 🎨 **Customizable Interface**
- **Brand customization** (logo, colors, company name)
- **Responsive design** for all devices
- **Modern UI/UX** with Tailwind CSS
- **Dark/light theme support**

### 📋 **Task & Planning Management**
- **To-do lists** with priority levels
- **Production planning** with deadlines
- **Team collaboration** features
- **Progress tracking**

### 💾 **Data Management**
- **CSV import/export** for sales data
- **Automatic backups** and data persistence
- **Local storage** with cloud-ready architecture
- **Data migration** tools

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/cookie-business/dashboard.git
cd cookie-business-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

### Default Login
- **Login Code:** `12345`
- **Role:** Administrator
- **Access:** Full permissions

## 🏗️ Build for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on push

### Vercel
1. Import project from GitHub
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

### Manual Deployment
1. Run `npm run build`
2. Upload `dist` folder to your web server
3. Configure server for SPA routing

## 🔧 Configuration

### Environment Variables
Create a `.env` file for custom configuration:

```env
VITE_APP_TITLE="Your Cookie Business"
VITE_DEFAULT_CURRENCY="EUR"
VITE_ENABLE_ANALYTICS=true
```

### Customization
- **Branding:** Use the Website Settings page to upload logo and customize colors
- **Users:** Add team members through User Management
- **Recipes:** Configure ingredient recipes for automatic cost calculation
- **Permissions:** Set granular access controls per user

## 📊 Key Metrics Tracked

### Sales Analytics
- Daily/weekly/monthly sales trends
- Platform performance comparison
- Revenue per cookie type
- Customer channel analysis

### Production Metrics
- Production efficiency rates
- Ingredient consumption tracking
- Waste reduction analytics
- Cost per unit analysis

### Financial Insights
- Profit margins per product
- Revenue forecasting
- Cost optimization recommendations
- ROI calculations

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Charts:** Recharts for interactive visualizations
- **Icons:** Lucide React
- **Routing:** React Router DOM
- **Build Tool:** Vite
- **Export:** jsPDF, xlsx for data exports
- **Storage:** LocalStorage with cloud-ready architecture

## 📚 Documentation

### User Guides
- [Getting Started Guide](docs/getting-started.md)
- [User Management](docs/user-management.md)
- [Sales Tracking](docs/sales-tracking.md)
- [Production Management](docs/production.md)
- [Analytics & Reports](docs/analytics.md)

### Developer Docs
- [API Reference](docs/api.md)
- [Component Library](docs/components.md)
- [Deployment Guide](docs/deployment.md)
- [Customization](docs/customization.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** [docs.cookie-dashboard.com](https://docs.cookie-dashboard.com)
- **Issues:** [GitHub Issues](https://github.com/cookie-business/dashboard/issues)
- **Discussions:** [GitHub Discussions](https://github.com/cookie-business/dashboard/discussions)
- **Email:** support@cookie-dashboard.com

## 🎯 Roadmap

### Version 1.1 (Coming Soon)
- [ ] Cloud synchronization
- [ ] Mobile app companion
- [ ] Advanced forecasting
- [ ] Integration with POS systems

### Version 1.2
- [ ] Multi-location support
- [ ] Advanced reporting
- [ ] API for third-party integrations
- [ ] Real-time notifications

## 🏆 Features Highlights

### 🎨 **Beautiful Design**
- Modern, professional interface
- Responsive design for all devices
- Customizable branding and themes
- Intuitive user experience

### 📊 **Advanced Analytics**
- Interactive charts and graphs
- Real-time data visualization
- Export capabilities (PDF, Excel)
- Comprehensive reporting

### 🔒 **Enterprise Security**
- Role-based access control
- Secure authentication
- Data encryption
- Audit trails

### ⚡ **Performance**
- Fast loading times
- Optimized for mobile
- Offline capability
- Real-time updates

---

**Made with ❤️ for cookie businesses worldwide**

*Transform your cookie business with professional-grade management tools.*