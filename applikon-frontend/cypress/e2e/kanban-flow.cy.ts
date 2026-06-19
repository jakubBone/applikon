describe('Kanban Board Functionality', () => {
  beforeEach(() => {
    cy.interceptApi()

    // Mock some applications
    cy.intercept('GET', '/api/applications', {
      body: [
        {
          id: 1,
          company: 'Google',
          position: 'Frontend Dev',
          status: 'SENT',
          salaryMin: 10000,
          currency: 'PLN',
          appliedAt: '2024-01-15T10:00:00'
        },
        {
          id: 2,
          company: 'Meta',
          position: 'Backend Dev',
          status: 'IN_PROGRESS',
          currentStage: 'Rozmowa z HR',
          salaryMin: 15000,
          currency: 'EUR',
          appliedAt: '2024-01-10T09:00:00'
        },
        {
          id: 3,
          company: 'Netflix',
          position: 'DevOps',
          status: 'OFFER',
          salaryMin: 20000,
          currency: 'USD',
          appliedAt: '2024-01-05T08:00:00'
        }
      ]
    }).as('getApplicationsWithData')

    cy.login()
    cy.wait('@getApplicationsWithData')
    cy.wait('@getBadges')
  })

  describe('Kanban Display', () => {
    it('should display all three columns', () => {
      cy.get('.kanban-column').should('have.length', 3)
      cy.contains('Wysłane').should('be.visible')
      cy.contains('W procesie').should('be.visible')
      cy.contains('Zakończone').should('be.visible')
    })

    it('should display applications in correct columns', () => {
      // Google should be in Sent column
      cy.get('.kanban-column').first().within(() => {
        cy.contains('Google').should('be.visible')
      })

      // Meta should be in W procesie column
      cy.get('.kanban-column').eq(1).within(() => {
        cy.contains('Meta').should('be.visible')
      })
    })

    it('should display application cards with company name', () => {
      cy.contains('Google').should('be.visible')
      cy.contains('Meta').should('be.visible')
      cy.contains('Netflix').should('be.visible')
    })

    it('should display current stage for in-progress applications', () => {
      cy.contains('Rozmowa z HR').should('be.visible')
    })
  })

  describe('Application Details', () => {
    it('should open application details when clicking on a card', () => {
      cy.contains('.kanban-card', 'Google').click()

      cy.get('.details-view').should('be.visible')
      cy.contains('h2', 'Google').should('be.visible')
      cy.contains('Frontend Dev').should('be.visible')
    })

    it('should show back button in details view', () => {
      cy.contains('.kanban-card', 'Google').click()
      cy.get('.back-btn').should('be.visible')
      cy.contains('Powrót').should('be.visible')
    })

    it('should return to kanban when clicking back', () => {
      cy.contains('.kanban-card', 'Google').click()
      cy.get('.details-view').should('be.visible')

      cy.get('.back-btn').click()
      cy.get('.kanban-board').should('be.visible')
    })

    it('should display salary information in details', () => {
      cy.contains('.kanban-card', 'Google').click()

      cy.contains('Zaproponowałeś wynagrodzenie').should('be.visible')
      cy.contains('10 000').should('be.visible') // Polish number format
    })
  })

  describe('Stage Change', () => {
    it('should show stage dropdown when clicking stage button', () => {
      // Meta is W_PROCESIE — stage selector button only renders for in-progress cards
      cy.contains('.kanban-card', 'Meta').within(() => {
        cy.get('.stage-selector-btn').click()
      })

      // Stage options should appear
      cy.get('.stage-dropdown').should('be.visible')
    })

    it('should allow selecting a predefined stage', () => {
      cy.intercept('PATCH', '/api/applications/2/stage', {
        body: {
          id: 2,
          company: 'Meta',
          position: 'Backend Dev',
          status: 'W_PROCESIE',
          currentStage: 'stage.technicalInterview'
        }
      }).as('updateStageResponse')

      cy.contains('.kanban-card', 'Meta').within(() => {
        cy.get('.stage-selector-btn').click()
      })

      cy.get('.stage-dropdown').contains('Rozmowa techniczna').click()

      cy.wait('@updateStageResponse')
    })
  })

  describe('Edit Application', () => {
    it('should open edit form from details view', () => {
      cy.contains('.kanban-card', 'Google').click()
      cy.get('.edit-btn').click()

      cy.get('.form-modal').should('be.visible')
      cy.contains('Edytuj aplikację').should('be.visible')
    })

    it('should pre-fill form with existing data', () => {
      cy.contains('.kanban-card', 'Google').click()
      cy.get('.edit-btn').click()

      cy.get('#edit-company').should('have.value', 'Google')
      cy.get('#edit-position').should('have.value', 'Frontend Dev')
    })

    it('should update application on submit', () => {
      cy.intercept('PUT', '/api/applications/1', {
        body: {
          id: 1,
          company: 'Google Updated',
          position: 'Senior Frontend Dev',
          status: 'SENT',
          salaryMin: 12000,
          currency: 'PLN'
        }
      }).as('updateApplication')

      cy.contains('.kanban-card', 'Google').click()
      cy.get('.edit-btn').click()

      cy.get('#edit-company').clear().type('Google Updated')
      cy.get('#edit-position').clear().type('Senior Frontend Dev')

      cy.get('[data-cy="form-submit-btn"]').click()

      cy.wait('@updateApplication').its('request.body').should('deep.include', {
        company: 'Google Updated',
        position: 'Senior Frontend Dev'
      })
    })
  })
})
