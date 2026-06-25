Optimize the database structure for tenants, tenant_kycs, users, customers, and customer_kycs to remove duplicate image/logo fields and clearly separate company branding, customer branding, KYC documents, and user profile images.

Goal

Unify the image and profile data structure so that each table owns only the data that belongs to it.

Required structure

tenants table

Store only the tenant company’s official business information.

Use this table for:

company name
company email
company phone
business address
website
official company logo

The logo field in tenants should be used for:

tenant company profile
admin tenant CRUD
tenant branding
document branding where the tenant company logo is required
tenant_kycs table

Store only tenant verification and compliance information.

This includes:

CAC documents
NAICOM license documents
tax documents
approval status
rejection/approval notes

Do not duplicate company logos, profile images, or avatars in this table.

users table

Store authentication and signed-in user profile information for all platform users, including tenant users, staff users, super admins, and customer users.

Add/use an avatar field in the users table.

The avatar field should be used for:

profile page image
dashboard user avatar
account settings
user CRUD profile image
signed-in customer profile image
customers table

Store only the customer’s official business/client information.

For corporate customers, this includes:

business/company name
official email
official phone
business address
registration number
official customer business logo

The logo field in customers should represent the customer’s business/company logo only.

For individual customers, the customer record should store official client data, while the personal profile image should still come from users.avatar.

customer_kycs table

Remove the profile_image_path field from customer_kycs.

This table should only store customer KYC and verification documents, such as:

ID document
proof of address
CAC document, where applicable
tax or registration documents
verification status
approval/rejection notes

It should not store profile images, avatars, or business logos.

Profile page update

Update the user profile page so that profile images are loaded from and saved to:

users.avatar

Do not use:

customer_kycs.profile_image_path

for profile images anymore.

Image ownership rule

Use this rule across the app:

tenants.logo = tenant company official logo
customers.logo = customer business/company official logo
users.avatar = signed-in user personal profile image
tenant_kycs = tenant compliance documents only
customer_kycs = customer compliance documents only

Implementation tasks

Refactor the following areas:

database migrations
Eloquent models
relationships
validation rules
controllers
API resources
Inertia props
React/TypeScript types
profile page upload logic
tenant CRUD logo upload logic
customer CRUD logo upload logic
KYC upload logic

Expected result

The application should no longer duplicate logos, avatars, or profile images across unrelated tables.

Company logos should come from tenants.logo.

Customer business logos should come from customers.logo.

Signed-in user profile images should come from users.avatar.

KYC tables should only handle verification and compliance documents.
