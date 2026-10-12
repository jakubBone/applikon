package com.applikon.service.brief;

// Port to the AI provider that generates a brief. The domain depends only on this interface.
// The Groq and Gemini adapters and the FakeBriefGenerator (tests) are interchangeable.
// A provider error is thrown for the caller to turn into a FAILED brief.
// The company name is the only thing that ever leaves the system here (ADR-006).
public interface BriefGenerator {

    GeneratedBrief generate(String companyName);
}
