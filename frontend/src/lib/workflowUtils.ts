import { toast } from 'sonner';

/**
 * Handle post-approval redirection based on stage number and user role
 * @param stageNumber - The workflow stage number
 * @param userRole - The current user's role
 * @param navigate - React Router navigate function
 * @param useToast - Toast function (optional, defaults to sonner toast)
 */
export const handlePostApprovalRedirect = (
  stageNumber: number,
  userRole: string,
  navigate: (path: string) => void,
  toastFn?: (options: { title: string }) => void
): boolean => {
  const showToast = toastFn || ((options) => toast.success(options.title));

  console.log("Redirect check:", { stageNumber, userRole });

  if (stageNumber === 6 && userRole === 'IL') {
    console.log("Redirecting to /timeline-tracker");
    showToast({ title: 'Redirecting to Timeline Tracker...' });
    navigate('/timeline-tracker');
    return true;
  }

  if (stageNumber === 9 && userRole === 'STLD') {
    console.log("Redirecting to /monthly-monitoring");
    showToast({ title: 'Redirecting to Monthly Monitoring...' });
    navigate('/monthly-monitoring');
    return true;
  }

  console.log("No redirection performed.");
  return false;
};


/**
 * Check if a user should be redirected after approving a specific stage
 * @param stageNumber - The workflow stage number
 * @param userRole - The current user's role
 * @returns boolean indicating if redirect should happen
 */
export const shouldRedirectAfterApproval = (stageNumber: number, userRole: string): boolean => {
  return (stageNumber === 6 && userRole === 'IL') || (stageNumber === 9 && userRole === 'STLD');
};