export function applicationStatusMessage(status, targetTitle) {
  return {
    type: 'application_status',
    title: 'Application update',
    message: `Your application for "${targetTitle}" is now: ${status.replace('_', ' ')}.`,
  };
}

export function interviewScheduledMessage(targetTitle, scheduledAt) {
  return {
    type: 'interview',
    title: 'Interview scheduled',
    message: `Your interview for "${targetTitle}" is scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
  };
}

export function offerIssuedMessage(targetTitle) {
  return {
    type: 'offer',
    title: 'Offer received!',
    message: `Congratulations! You've received an offer for "${targetTitle}".`,
  };
}

export function driveScheduledMessage(companyName, driveDate) {
  return {
    type: 'drive',
    title: 'Placement drive scheduled',
    message: `${companyName} is holding a placement drive on ${new Date(driveDate).toLocaleDateString()}.`,
  };
}
