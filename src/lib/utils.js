/**
 * Generates a unique slug for a wedding invitation.
 * Example: "rahul-weds-priya"
 */
export function generateSlug(groomName, brideName) {
  const base = `${groomName}-weds-${brideName}`
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric except spaces and dashes
    .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with dashes
    .replace(/^-+|-+$/g, ''); // Trim dashes from ends
  
  // In a real app, we'd check the DB here, but for now we return the base.
  // The backend will handle unique suffixing (e.g. -2, -3).
  return base;
}
