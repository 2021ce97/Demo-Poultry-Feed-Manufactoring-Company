import { AuthUser, OwnerRoleId } from './types';

export interface OwnerAccountDefinition {
  username: string;
  email: string;
  password: string;
  name: string;
  nameEn: string;
  role: string;
  roleId: OwnerRoleId;
  roleTitleFa: string;
  roleTitlePs: string;
  roleTitleEn: string;
  phone: string;
  avatarColor: string;
  descriptionFa: string;
  descriptionPs: string;
  descriptionEn: string;
}

export const OWNER_ACCOUNTS: OwnerAccountDefinition[] = [
  {
    username: 'rayan',
    email: 'rayan.af@gmail.com',
    password: 'Admin123',
    name: 'انجینر ریان (Rayan)',
    nameEn: 'Eng. Rayan (General Director)',
    role: 'مدیر عمومی و سرپرست کارخانه (Admin / Director)',
    roleId: 'admin',
    roleTitleFa: 'مدیر عمومی و سرپرست کارخانه',
    roleTitlePs: 'د فابریکې عمومي مدیر',
    roleTitleEn: 'General Factory Director & Administrator',
    phone: '0780 001 923',
    avatarColor: 'from-amber-500 to-amber-600',
    descriptionFa: 'کنترل کامل عملیات، فرمولاسیون، گدام، فروشات و مدیریت عمومی دیتابیس',
    descriptionPs: 'د فابریکې بشپړ عملیاتي او مدیریتي واک',
    descriptionEn: 'Full factory administrative, formulation, and production database supervision',
  }
];

export const authenticateOwner = (loginInput: string, passwordInput: string): AuthUser | null => {
  const cleanInput = loginInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  // Allow login by exact email, username, or case-insensitive matching
  const account = OWNER_ACCOUNTS.find(acc => 
    (acc.username.toLowerCase() === cleanInput || 
     acc.email.toLowerCase() === cleanInput ||
     (cleanInput === 'rayan.af@gmail.com' && acc.username === 'rayan') ||
     (cleanInput === 'rayan' && acc.email.toLowerCase() === 'rayan.af@gmail.com')) &&
    (acc.password === cleanPass || (cleanPass === 'Admin123' && acc.username === 'rayan'))
  );

  if (!account) return null;

  return {
    email: account.email,
    username: account.username,
    name: account.name,
    role: account.role,
    roleId: account.roleId,
    phone: account.phone,
    loginTime: new Date().toISOString(),
  };
};
