import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const stmts = [
    `UPDATE "_prisma_migrations" SET checksum = 'd4ad14417b882adb67c3b738bac54ab854e8f5ad282f5695028088f391bfe22f' WHERE migration_name = '20260328000000_contact_settings_and_messages'`,
    `UPDATE "_prisma_migrations" SET checksum = '0e4644a99408d7a733dbf79e4aa707e0a883d70330c0420bee56c8ac519cdf3e' WHERE migration_name = '20260331160000_social_feed'`,
    `UPDATE "_prisma_migrations" SET migration_name = '20260328001000_contact_settings_brand_logo' WHERE migration_name = '20260327120000_contact_settings_brand_logo'`,
    `UPDATE "_prisma_migrations" SET migration_name = '20260328002000_contact_settings_brand_visibility' WHERE migration_name = '20260327130000_contact_settings_brand_visibility'`,
    `UPDATE "_prisma_migrations" SET migration_name = '20260328003000_contact_settings_footer_brand' WHERE migration_name = '20260327150000_contact_settings_footer_brand'`,
    `UPDATE "_prisma_migrations" SET migration_name = '20260328171000_multi_brand_super_admin' WHERE migration_name = '20260327200000_multi_brand_super_admin'`,
    `DELETE FROM "_prisma_migrations" WHERE migration_name IN ('20260331170000_drop_social_feed_seo_articles', '20260328140000_contact_settings_storefront_theme', '20260328160000_drop_contact_settings_storefront_theme')`,
  ];
  for (const s of stmts) {
    await prisma.$executeRawUnsafe(s);
  }
  console.log('Migration history rows updated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
