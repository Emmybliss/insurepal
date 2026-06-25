# 🗄️ InsurePal Database Setup Guide

This guide will help you set up the database for your InsurePal multi-tenant insurance SaaS application.

## 📋 Prerequisites

Before running the migrations and seeders, ensure you have:

1. ✅ PHP 8.2+ installed
2. ✅ Composer dependencies installed (`composer install`)
3. ✅ Database server running (MySQL 8+)
4. ✅ `.env` file configured with correct database credentials

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

#### Windows:
```cmd
setup-database.bat
```

#### Linux/Mac:
```bash
chmod +x setup-database.sh
./setup-database.sh
```

### Option 2: Manual Setup

#### Step 1: Reset Database (Optional)
```bash
php artisan migrate:reset --force
```

#### Step 2: Run Migrations
```bash
php artisan migrate --force
```

#### Step 3: Seed Database
```bash
php artisan db:seed --force
```

#### Step 4: Clear Caches
```bash
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
```

## 📊 What Gets Created

### 🗃️ Database Tables
- **Core Tables**: users, tenants, customers
- **Insurance Tables**: quotes, policies, insurance_products
- **Financial Tables**: financial_notes, payments, subscriptions
- **System Tables**: roles, permissions, notifications, messages
- **Policy Management**: policy_types, policy_categories, policy_classes

### 🌱 Seeded Data

#### 1. **Roles & Permissions**
- Super Admin, Underwriter, Broker, Staff, Customer roles
- Comprehensive permission system for multi-tenant access control

#### 2. **Subscription Plans**
- Starter Plan: ₦25,000/month (50 policies, 3 users)
- Professional Plan: ₦50,000/month (500 policies, 10 users)
- Enterprise Plan: ₦100,000/month (unlimited)

#### 3. **Insurance Products**
- Third Party Motor Insurance
- Comprehensive Motor Insurance
- Term Life Insurance
- Home Insurance
- Travel Insurance

#### 4. **Policy Structure**
- **Policy Types**: Motor, Life, Property, Marine, Travel
- **Categories**: Private Motor, Commercial Motor, Term Life, etc.
- **Classes**: Comprehensive Cover, Third Party Only, etc.

#### 5. **Development Test Data** (Local/Development Only)
- 2 test tenants (1 broker, 1 underwriter)
- 4 test users with different roles
- 5 test customers
- 4 sample quotes in different statuses

## 🔐 Default Login Credentials

### Super Admin
- **Email**: admin@insurepal.com
- **Password**: password123!
- **Access**: Full system administration

### Test Accounts (Development Only)

#### Broker Account
- **Email**: broker@test.com
- **Password**: password
- **Tenant**: Demo Insurance Brokerage Ltd

#### Underwriter Account
- **Email**: underwriter@test.com
- **Password**: password
- **Tenant**: Premium Underwriters Nigeria

#### Customer Account
- **Email**: customer@test.com
- **Password**: password
- **Access**: Customer self-service portal

## 🛠️ Individual Seeders

You can run individual seeders if needed:

```bash
# Core system data
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=SuperAdminSeeder
php artisan db:seed --class=SubscriptionPlanSeeder

# Insurance products and policies
php artisan db:seed --class=InsuranceProductSeeder
php artisan db:seed --class=PolicyTypeSeeder
php artisan db:seed --class=PolicyCategorySeeder
php artisan db:seed --class=PolicyClassSeeder

# Development test data (local/development only)
php artisan db:seed --class=DevelopmentDataSeeder
```

## 🔍 Verification

After setup, verify your database by checking:

1. **Tables Created**: Run `php artisan migrate:status`
2. **Super Admin Login**: Visit `/login` and use super admin credentials
3. **Test Data**: Check if tenants and quotes are visible in the admin panel

## 🚨 Troubleshooting

### Migration Errors
```bash
# Reset and retry
php artisan migrate:reset
php artisan migrate --force
```

### Permission Errors
```bash
# Clear all caches and regenerate
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear
```

### Seeder Errors
```bash
# Run seeders individually to identify issues
php artisan db:seed --class=RolesAndPermissionsSeeder
```

## 🔄 Reset Database

To completely reset your database:

```bash
php artisan migrate:reset --force
php artisan migrate --force
php artisan db:seed --force
```

## 🏗️ Production Considerations

For production deployment:
1. Remove or modify `DevelopmentDataSeeder`
2. Change default passwords
3. Use environment-specific configurations
4. Set up proper backup procedures
5. Configure database encryption

---

## 📞 Support

If you encounter any issues during setup, check:
1. Database connection settings in `.env`
2. PHP and Laravel requirements
3. Database user permissions
4. Error logs in `storage/logs/`

Your InsurePal application should now be ready with a fully configured multi-tenant insurance management system! 🎉