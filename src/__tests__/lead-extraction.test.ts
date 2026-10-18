import { describe, expect, it } from "vitest";
import {
  buildFinalChatReply,
  buildLeadUpdates,
  extractAppointmentInfo,
  extractLeadInfo,
} from "../../supabase/functions/ai-chat/lead-extraction";

describe("chat lead extraction", () => {
  it("extracts names when the name introduction is lowercase", () => {
    expect(extractLeadInfo("my name is Alex Test, alex@example.com")).toEqual({
      name: "Alex Test",
      email: "alex@example.com",
      hasInfo: true,
    });
  });

  it("uses the current demo request instead of unrelated older service text", () => {
    const messages = [
      "I have a leaking pipe.",
      "Please schedule a demo.",
      "My name is Alex Test, email alex@example.com. 2026-10-21 at 14:30 works.",
    ];

    expect(extractAppointmentInfo(messages)).toEqual({
      date: "2026-10-21",
      time: "14:30",
      service: "demo",
    });
  });

  it("does not create a contractor appointment from a WorkforceAI website chat", () => {
    const messages = [
      "Please schedule a plumbing repair for October 21, 2026 at 2:30 PM.",
    ];

    expect(extractAppointmentInfo(messages)).toBeNull();
  });

  it("extracts a demo request with a written month date", () => {
    const messages = [
      "I'd like to schedule a demo on October 21, 2026 at 2:30 PM.",
      "My name is Alex Test and my email is alex@example.com.",
    ];

    expect(extractAppointmentInfo(messages)).toEqual({
      date: "2026-10-21",
      time: "2:30 PM",
      service: "demo",
    });
  });

  it("updates only newly captured lead details and the latest requested service", () => {
    expect(buildLeadUpdates(
      { name: "Alex Test", email: "workforceai-chat-test@example.com", hasInfo: true },
      { date: "2026-10-21", time: "2:30 PM", service: "demo" },
    )).toEqual({
      name: "Alex Test",
      email: "workforceai-chat-test@example.com",
      service: "demo",
    });

    expect(buildLeadUpdates({ hasInfo: true }, null)).toEqual({});
  });

  it("confirms only when both the lead and appointment were saved", () => {
    const appointmentInfo = { date: "2026-10-21", time: "2:30 PM", service: "demo" };
    expect(buildFinalChatReply({
      generatedReply: "generated",
      leadName: "Alex",
      appointmentInfo,
      appointmentSaved: true,
      leadSaved: true,
      persistenceFailed: false,
      hasContact: true,
    })).toBe("Thanks, Alex. I've recorded your request for a WorkforceAI demo on 2026-10-21 at 2:30 PM. Our team will follow up to confirm availability.");

    expect(buildFinalChatReply({
      generatedReply: "generated claim that it was saved",
      appointmentInfo,
      appointmentSaved: true,
      leadSaved: false,
      persistenceFailed: true,
      hasContact: true,
    })).toContain("couldn't save your demo request");
  });

  it("requests contact details instead of claiming the appointment request was saved", () => {
    expect(buildFinalChatReply({
      generatedReply: "generated claim that it was saved",
      appointmentInfo: { date: "2026-10-21", time: "2:30 PM", service: "demo" },
      appointmentSaved: false,
      leadSaved: false,
      persistenceFailed: false,
      hasContact: false,
    })).toContain("Please share an email address or phone number");
  });

  it("returns a clear error when saving contact details fails", () => {
    expect(buildFinalChatReply({
      generatedReply: "generated claim that it was saved",
      appointmentInfo: null,
      appointmentSaved: false,
      leadSaved: false,
      persistenceFailed: true,
      hasContact: true,
    })).toContain("couldn't save your contact details");
  });
});
