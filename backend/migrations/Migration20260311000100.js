const { Migration } = require('@mikro-orm/migrations');

class Migration20260311000100 extends Migration {
  async up() {
    this.addSql('create table if not exists "users" ("id" serial primary key, "first_name" varchar(120) not null, "last_name" varchar(120) not null, "name" varchar(255) null, "email" varchar(255) not null unique, "phone" varchar(255) null, "password_hash" varchar(255) not null, "role" varchar(30) not null default \'CUSTOMER\', "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());');

    this.addSql('create table if not exists "categories" ("id" serial primary key, "name" varchar(255) not null unique, "slug" varchar(255) not null unique, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());');

    this.addSql('create table if not exists "addresses" ("id" serial primary key, "user_id" int not null, "full_name" varchar(255) not null, "phone" varchar(255) not null, "address_line1" varchar(255) not null, "address_line2" varchar(255) null, "city" varchar(255) not null, "state" varchar(255) not null, "postal_code" varchar(255) not null, "country" varchar(255) not null, "is_default" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());');
    this.addSql('alter table "addresses" add constraint "addresses_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;');

    this.addSql('create table if not exists "products" ("id" serial primary key, "name" varchar(255) not null, "slug" varchar(255) not null unique, "short_description" varchar(255) null, "description" text null, "price_cents" int not null, "stock" int not null default 0, "category_id" int not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());');
    this.addSql('alter table "products" add constraint "products_category_id_foreign" foreign key ("category_id") references "categories" ("id") on update cascade;');

    this.addSql('create table if not exists "product_images" ("id" serial primary key, "product_id" int not null, "image_url" varchar(255) not null);');
    this.addSql('alter table "product_images" add constraint "product_images_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete cascade;');

    this.addSql('create table if not exists "product_colors" ("id" serial primary key, "product_id" int not null, "color_name" varchar(255) not null, "color_code" varchar(255) not null, "stock" int null);');
    this.addSql('alter table "product_colors" add constraint "product_colors_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete cascade;');

    this.addSql('create table if not exists "orders" ("id" serial primary key, "user_id" int not null, "address_id" int not null, "total_amount_cents" int not null, "status" varchar(30) not null default \'PENDING\', "payment_status" varchar(30) not null default \'PENDING\', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());');
    this.addSql('alter table "orders" add constraint "orders_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;');
    this.addSql('alter table "orders" add constraint "orders_address_id_foreign" foreign key ("address_id") references "addresses" ("id") on update cascade;');

    this.addSql('create table if not exists "order_items" ("id" serial primary key, "order_id" int not null, "product_id" int not null, "product_name_snapshot" varchar(255) not null, "product_price_snapshot_cents" int not null, "color_name" varchar(255) null, "quantity" int not null, "subtotal_cents" int not null);');
    this.addSql('alter table "order_items" add constraint "order_items_order_id_foreign" foreign key ("order_id") references "orders" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "order_items" add constraint "order_items_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;');
  }
}

module.exports = { Migration20260311000100 };
