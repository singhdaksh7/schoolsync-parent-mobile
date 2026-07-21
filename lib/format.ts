export function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleDateString();
}

export function formatDateTime(isoDate: string) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleString();
}

export function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function classSectionLabel(section?: { name?: string; class?: { name?: string } }) {
  if (section?.class?.name && section.name) return `${section.class.name}-${section.name}`;
  if (section?.class?.name) return section.class.name;
  if (section?.name) return section.name;
  return 'Section not assigned';
}

export function isAdminRole(role?: string) {
  return role === 'SCHOOL_OWNER' || role === 'SCHOOL_ADMIN' || role === 'VICE_PRINCIPAL';
}

export function roleLabel(role?: string) {
  if (role === 'SCHOOL_OWNER') return 'Owner';
  if (role === 'SCHOOL_ADMIN') return 'Admin';
  if (role === 'VICE_PRINCIPAL') return 'Principal';
  if (role === 'TEACHER') return 'Teacher';
  if (role === 'STUDENT') return 'Student';
  if (role === 'DRIVER') return 'Driver';
  return 'Parent';
}
