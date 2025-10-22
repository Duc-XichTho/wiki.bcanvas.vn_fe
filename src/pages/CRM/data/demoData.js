// Demo data for testing CRM interface
export const demoCustomers = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-0123',
    company: 'Tech Corp',
    status: 'active',
    createdAt: '2024-01-15',
    last_contact: '2024-08-15',
    total_spent: 12500
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.j@company.com',
    phone: '+1-555-0456',
    company: 'Design Studio',
    status: 'active',
    createdAt: '2024-02-20',
    last_contact: '2024-07-22',
    total_spent: 8900
  },
  {
    id: 3,
    name: 'Mike Wilson',
    email: 'mike.wilson@biz.com',
    phone: '+1-555-0789',
    company: 'Marketing Inc',
    status: 'inactive',
    createdAt: '2024-01-10',
    last_contact: '2024-06-10',
    total_spent: 15600
  },
  {
    id: 4,
    name: 'Emma Brown',
    email: 'emma.brown@startup.io',
    phone: '+1-555-0321',
    company: 'Innovation Labs',
    status: 'active',
    createdAt: '2024-03-05',
    last_contact: '2024-09-03',
    total_spent: 5400
  }
];

export const demoTransactions = [
  {
    id: 1,
    customer_id: 1,
    transaction_date: '2024-08-15',
    amount: 2500,
    description: 'Software License',
    type: 'purchase',
    status: 'completed'
  },
  {
    id: 2,
    customer_id: 1,
    transaction_date: '2024-07-20',
    amount: 1200,
    description: 'Consulting Services',
    type: 'service',
    status: 'completed'
  },
  {
    id: 3,
    customer_id: 2,
    transaction_date: '2024-07-22',
    amount: 3400,
    description: 'Design Package',
    type: 'service',
    status: 'completed'
  },
  {
    id: 4,
    customer_id: 3,
    transaction_date: '2024-06-10',
    amount: 5600,
    description: 'Marketing Campaign',
    type: 'service',
    status: 'completed'
  },
  {
    id: 5,
    customer_id: 4,
    transaction_date: '2024-08-30',
    amount: 1800,
    description: 'Product Purchase',
    type: 'purchase',
    status: 'completed'
  }
];

export const demoEmailHistory = [
  {
    id: 1,
    customer_id: 1,
    email_date: '2024-08-15',
    subject: 'Thank you for your purchase',
    type: 'automated',
    status: 'sent'
  },
  {
    id: 2,
    customer_id: 1,
    email_date: '2024-06-20',
    subject: 'Welcome to our service',
    type: 'automated',
    status: 'sent'
  },
  {
    id: 3,
    customer_id: 2,
    email_date: '2024-07-22',
    subject: 'Project completion confirmation',
    type: 'manual',
    status: 'sent'
  },
  {
    id: 4,
    customer_id: 2,
    email_date: '2024-05-15',
    subject: 'Follow-up on proposal',
    type: 'manual',
    status: 'sent'
  },
  {
    id: 5,
    customer_id: 3,
    email_date: '2024-06-10',
    subject: 'Marketing campaign update',
    type: 'automated',
    status: 'sent'
  },
  {
    id: 6,
    customer_id: 3,
    email_date: '2024-03-25',
    subject: 'Initial consultation',
    type: 'manual',
    status: 'sent'
  },
  {
    id: 7,
    customer_id: 4,
    email_date: '2024-09-03',
    subject: 'Welcome package',
    type: 'automated',
    status: 'sent'
  },
  {
    id: 8,
    customer_id: 4,
    email_date: '2024-08-10',
    subject: 'Product information',
    type: 'manual',
    status: 'sent'
  }
];

export const demoEmailTemplates = [
  {
    id: 1,
    name: 'Welcome Email',
    subject: 'Welcome to our service!',
    template: 'Hi {{name}},\n\nWelcome to our platform! We\'re excited to have you on board.\n\nBest regards,\nThe Team'
  },
  {
    id: 2,
    name: 'Follow-up Email',
    subject: 'Following up on your recent activity',
    template: 'Hello {{name}},\n\nWe wanted to follow up on your recent activity with {{company}}.\n\nLet us know if you need any assistance!\n\nBest regards,\nThe Team'
  },
  {
    id: 3,
    name: 'Promotional Email',
    subject: 'Special offer just for you!',
    template: 'Dear {{name}},\n\nWe have a special offer for valued customers like you at {{company}}.\n\nDon\'t miss out on this opportunity!\n\nBest regards,\nThe Team'
  },
  {
    id: 4,
    name: 'Re-engagement Email',
    subject: 'We miss you!',
    template: 'Hi {{name}},\n\nIt\'s been a while since we last heard from you. We\'d love to reconnect!\n\nWhat can we do to serve you better?\n\nBest regards,\nThe Team'
  }
];
