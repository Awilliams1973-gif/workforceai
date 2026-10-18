export interface AppointmentInfo {
  date: string;
  time: string;
  service: string;
}

export interface LeadInfo {
  name?: string;
  email?: string;
  phone?: string;
  hasInfo: boolean;
}

export interface LeadUpdates {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
}

export function buildLeadUpdates(leadInfo: LeadInfo, appointmentInfo: AppointmentInfo | null): LeadUpdates {
  return {
    ...(leadInfo.name ? { name: leadInfo.name } : {}),
    ...(leadInfo.email ? { email: leadInfo.email } : {}),
    ...(leadInfo.phone ? { phone: leadInfo.phone } : {}),
    ...(appointmentInfo ? { service: appointmentInfo.service } : {}),
  };
}

export function buildAppointmentConfirmation(name: string | undefined, appointmentInfo: AppointmentInfo): string {
  const greeting = name ? `Thanks, ${name}.` : "Thanks for your request.";
  return `${greeting} I've recorded your request for a WorkforceAI ${appointmentInfo.service} on ${appointmentInfo.date} at ${appointmentInfo.time}. Our team will follow up to confirm availability.`;
}

export function buildPersistenceFailureReply(isAppointmentRequest: boolean, hasContact: boolean): string {
  if (isAppointmentRequest) {
    return "I couldn't save your demo request just now. Please try again shortly or contact the WorkforceAI team directly.";
  }
  if (hasContact) {
    return "I couldn't save your contact details just now. Please try again shortly or contact the WorkforceAI team directly.";
  }
  return "I couldn't save your message just now. Please try again shortly or contact the WorkforceAI team directly.";
}

export function buildMissingContactReply(): string {
  return "I can pass your WorkforceAI demo or meeting request to the team. Please share an email address or phone number so they can follow up.";
}

export function buildFinalChatReply(options: {
  generatedReply: string;
  leadName?: string;
  appointmentInfo: AppointmentInfo | null;
  appointmentSaved: boolean;
  leadSaved: boolean;
  persistenceFailed: boolean;
  hasContact: boolean;
}): string {
  const {
    generatedReply,
    leadName,
    appointmentInfo,
    appointmentSaved,
    leadSaved,
    persistenceFailed,
    hasContact,
  } = options;

  if (appointmentInfo) {
    if (appointmentSaved && leadSaved) return buildAppointmentConfirmation(leadName, appointmentInfo);
    if (!hasContact) return buildMissingContactReply();
    return buildPersistenceFailureReply(true, true);
  }
  if (persistenceFailed) return buildPersistenceFailureReply(false, hasContact);
  if (leadSaved) return `Thanks, ${leadName || "there"}. I've saved your contact details, and our team will follow up.`;
  return generatedReply;
}

export function extractAppointmentInfo(userMessages: string[]): AppointmentInfo | null {
  let appointmentIndex = -1;
  for (let index = userMessages.length - 1; index >= 0; index--) {
    if (/(appointment|schedule|book|available|visit|demo|meeting|consultation|walkthrough)/i.test(userMessages[index])) {
      appointmentIndex = index;
      break;
    }
  }
  if (appointmentIndex === -1) return null;

  const appointmentMessages = userMessages.slice(appointmentIndex);
  const datePattern = /\b(20\d{2}-\d{2}-\d{2}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+20\d{2})\b/i;
  const timePattern = /\b(\d{1,2}:\d{2})\s*(am|pm)?\b/i;
  const dateMatch = [...appointmentMessages].reverse().map((message) => message.match(datePattern)).find(Boolean);
  const timeMatch = [...appointmentMessages].reverse().map((message) => message.match(timePattern)).find(Boolean);
  const findService = (source: string) => {
    const requestedType = source.match(/\b(demo|meeting|consultation|walkthrough|introductory call|discovery call)\b/i);
    if (requestedType) return { service: requestedType[1].toLowerCase() };
    if (/\bappointment\b.*\b(?:with|for)\s+(?:the\s+)?(?:WorkforceAI\s+)?team\b/i.test(source)) {
      return { service: "team meeting" };
    }
    return null;
  };
  const serviceMatch = findService(userMessages[appointmentIndex])
    || (appointmentIndex > 0 ? findService(userMessages[appointmentIndex - 1]) : null);

  if (!dateMatch || !timeMatch || !serviceMatch) return null;

  const matchedDate = dateMatch[1];
  let date = matchedDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(matchedDate)) {
    const parsedDate = new Date(`${matchedDate} UTC`);
    if (Number.isNaN(parsedDate.getTime())) return null;
    date = parsedDate.toISOString().slice(0, 10);
  }
  const time = timeMatch[2] ? `${timeMatch[1]} ${timeMatch[2]}` : timeMatch[1];
  return { date, time, service: serviceMatch.service };
}

export function extractLeadInfo(text: string): LeadInfo {
  const info: LeadInfo = { hasInfo: false };

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    info.email = emailMatch[0];
    info.hasInfo = true;
  }

  const phoneMatch = text.match(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    info.phone = phoneMatch[0].trim();
    info.hasInfo = true;
  }

  const nameMatch = text.match(/(?:my name is|i'm|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch) {
    info.name = nameMatch[1];
    info.hasInfo = true;
  }

  return info;
}
