// Happy path for the v2 cheat-sheet hub: pick a company, read its prep (salary +
// company answers + global answers), and add a custom company question.
//
// Language-independent on purpose: assertions use data-cy hooks and English test
// data only — never translated UI strings — so the spec survives i18n changes.
// Backend is stubbed via cy.interceptApi() + the extra intercepts below.

describe('Cheat sheet hub', () => {
  const app = {
    id: 1,
    company: 'Acme',
    position: 'Java Developer',
    status: 'SENT',
    appliedAt: '2026-06-01T10:00:00',
    currentStage: null,
    rejectionReason: null,
    salary: 12000,
    salaryMin: null,
    salaryMax: null,
    currency: 'PLN',
    salaryType: null,
    contractType: null,
    source: null,
    link: null,
    cvFileName: null,
  }

  beforeEach(() => {
    cy.interceptApi()
    cy.intercept('GET', '/api/applications', { body: [app] }).as('getApplications')
    cy.intercept('GET', '/api/screening-answers', {
      body: [
        { id: 1, questionKey: 'about-me', label: null, answer: 'Backend dev, 5 years', custom: false, sortOrder: 0 },
      ],
    }).as('getAnswers')
    // Per-application "About the company" answers (the fixed company-knowledge row).
    cy.intercept('GET', '/api/applications/*/screening-answers', {
      body: [
        { id: 10, questionKey: 'company-knowledge', label: null, answer: 'Fintech, 200 people, growth stage', custom: false, sortOrder: 0 },
      ],
    }).as('getCompanyAnswers')
    cy.intercept('PUT', '/api/applications/*/screening-answers', (req) => {
      req.reply({ statusCode: 200, body: req.body.answers })
    }).as('saveCompanyAnswers')
    cy.login()
    cy.wait('@getApplications')
  })

  it('shows per-application prep: salary + company answers + global answers', () => {
    cy.get('[data-cy="tab-answers"]').click()
    cy.get('[data-cy="cheat-picker"]').should('contain', 'Acme')

    // "About the company" — salary read-only + the company answer.
    cy.get('[data-cy="section-company"] .collapsible-toggle').click()
    cy.get('[data-cy="cheat-salary"]').should('contain', 'PLN')
    cy.get('[data-cy="section-company"]').should('contain', 'Fintech, 200 people')

    // "General" — the stubbed global answer.
    cy.get('[data-cy="section-general"] .collapsible-toggle').click()
    cy.get('[data-cy="section-general"]').should('contain', 'Backend dev, 5 years')
  })

  it('adds a custom question in "About the company" and saves it per application', () => {
    cy.get('[data-cy="tab-answers"]').click()

    cy.get('[data-cy="edit-company"]').click()
    cy.get('[data-cy="company-questions-modal"]').should('be.visible')

    cy.get('[data-cy="prep-add"]').click()
    cy.get('[data-cy="company-questions-modal"] .prep-label-input').type('Tech stack?')
    cy.get('[data-cy="company-questions-modal"] .prep-textarea').last().type('Java, Spring, Postgres')
    cy.get('[data-cy="prep-save"]').click()

    // The whole set is saved as per-application screening answers via PUT.
    cy.wait('@saveCompanyAnswers')
      .its('request.body.answers')
      .should((answers) => {
        expect(JSON.stringify(answers)).to.contain('Tech stack?')
      })
  })
})
