# Sistem Akuntansi ERP Rumah Sakit

## Overview
Sistem ERP Akuntansi untuk Rumah Sakit yang dibangun dengan Laravel, Inertia.js, React, dan TypeScript. Sistem ini mengelola modul Kas & Bank dengan fitur monthly closing yang terintegrasi.

## 📋 Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Documentation](#documentation)
- [Development](#development)

## ✨ Features

### Core Modules
- **Cash Management** - Pengelolaan transaksi kas
- **Bank Management** - Pengelolaan transaksi bank
- **Giro Management** - Pengelolaan transaksi giro
- **Journal Posting** - Sistem posting jurnal batch
- **Monthly Closing** - Sistem penutupan bulanan
- **Permission System** - Sistem otorisasi berbasis role

### Recent Updates (July 2025)
- ✅ **Giro Transaction Integration** - Support penuh untuk transaksi giro dalam monthly closing
- ✅ **Flexible Journal Posting** - Field `will_post_to_journal` untuk membedakan transaksi laporan vs jurnal
- ✅ **Enhanced Monthly Closing** - Logic yang lebih fleksibel untuk cut-off
- ✅ **Permission Enhancement** - Sistem permission yang lebih granular

## 🏗️ Architecture

### Backend
- **Framework**: Laravel 11
- **Database**: MySQL
- **Authentication**: Laravel Sanctum
- **API**: RESTful with Inertia.js

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Inertia.js
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: Inertia.js forms

### Key Design Patterns
- **Repository Pattern** - For data access
- **Service Layer** - For business logic
- **Event-Driven** - For workflow automation
- **Permission-Based** - For access control

## 🚀 Installation

### Prerequisites
- PHP 8.2+
- Node.js 18+
- MySQL 8.0+
- Composer
- NPM/Yarn

### Setup Steps
```bash
# Clone repository
git clone <repository-url>
cd akuntansi

# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate
php artisan db:seed

# Build frontend
npm run build

# Start development server
php artisan serve
```

## 📚 Documentation

### User Guides
- [Cash Management Guide](./features/cash-management.md)
- [Bank Management Guide](./features/bank-management.md)
- [Giro Management Guide](./features/giro-management.md)
- [Monthly Closing Guide](./features/monthly-closing.md)

### Technical Documentation
- [Database Schema](./technical/database-schema.md)
- [API Reference](./api/README.md)
- [Development Guide](./technical/development-guide.md)
- [Deployment Guide](./technical/deployment-guide.md)

### Features Documentation
- [Will Post to Journal Feature](./features/will-post-to-journal.md)
- [Permission System](./features/permission-system.md)
- [Workflow Integration](./features/workflow-integration.md)

## 🛠️ Development

### Tech Stack
- **Backend**: Laravel 11, MySQL, Redis
- **Frontend**: React 18, TypeScript, Inertia.js
- **Testing**: Pest PHP, React Testing Library
- **DevOps**: Docker, GitHub Actions

### Development Workflow
```bash
# Start development
npm run dev
php artisan serve

# Run tests
php artisan test
npm run test

# Code quality
composer pint
npm run lint
```

## 📋 Project Status

### Recently Completed
- [x] Giro transaction integration in monthly closing
- [x] `will_post_to_journal` field implementation
- [x] Enhanced permission system
- [x] Flexible cut-off logic

### In Progress
- [ ] Additional report features
- [ ] Advanced dashboard analytics
- [ ] Mobile responsiveness improvements

### Planned
- [ ] Integration with external banking APIs
- [ ] Advanced audit trails
- [ ] Multi-currency support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary software for hospital ERP system.

## 📞 Support

For support and questions:
- Documentation: `/docs`
- Issues: GitHub Issues
- Contact: [Contact Information]

---
**Last Updated**: July 11, 2025
**Version**: 2.0.0
