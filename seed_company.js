const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company_profiles.upsert({
    where: { name: 'VELOSI CERTIFICATION LLC' },
    update: {
      address: `Building No. 121340, First Floor, New Salata, C Ring Road\nP.O. Box 3408, Doha Qatar`,
      contact: `Tel no (+974) 44352850, Fax no (+974) 44352819\nEmail: velosi@qatar.net.qa`,
      bank_details: `Bank Transfer: Please remit the amount due to:\nACCOUNT NAME: VELOSI CERTIFICATION LLC\nBANK: BNP PARIBAS\nBRANCH: Al Fardan Office Tower, Doha, Qatar\nACCOUNT NO: 06691 093293 001 60\nCURRENCY ACCT: Qatar Riyal/US Dollar\nIBAN NO. (QAR) QA06BNPA000669109329300160QAR\nIBAN NO. (USD) QA88BNPA000669109329300160USD\nSWIFT CODE: BNPAQAQA`,
      logo_path: 'templates/logos/velosi_logo.png'
    },
    create: {
      name: 'VELOSI CERTIFICATION LLC',
      address: `Building No. 121340, First Floor, New Salata, C Ring Road\nP.O. Box 3408, Doha Qatar`,
      contact: `Tel no (+974) 44352850, Fax no (+974) 44352819\nEmail: velosi@qatar.net.qa`,
      bank_details: `Bank Transfer: Please remit the amount due to:\nACCOUNT NAME: VELOSI CERTIFICATION LLC\nBANK: BNP PARIBAS\nBRANCH: Al Fardan Office Tower, Doha, Qatar\nACCOUNT NO: 06691 093293 001 60\nCURRENCY ACCT: Qatar Riyal/US Dollar\nIBAN NO. (QAR) QA06BNPA000669109329300160QAR\nIBAN NO. (USD) QA88BNPA000669109329300160USD\nSWIFT CODE: BNPAQAQA`,
      logo_path: 'templates/logos/velosi_logo.png'
    },
  });
  console.log('Company Profile Preset Updated:', company.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
