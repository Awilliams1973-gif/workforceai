import { BrowserCheck } from 'checkly/constructs'

new BrowserCheck('planetlion-homepage', {
  name: 'planetlion.com – Homepage key content',
  frequency: 5,
  locations: ['us-east-1', 'eu-west-1'],
  intent: {
    goal: 'Verify that the planetlion.com homepage loads and displays all key sections.',
    constraints: [
      { type: 'REQUIRED_OUTCOME', statement: 'The hero heading "Your AI Employee for growing your business" is visible.' },
      { type: 'REQUIRED_OUTCOME', statement: 'The navigation buttons for How it works, AI Employees, and Pricing are visible.' },
      { type: 'REQUIRED_OUTCOME', statement: 'The How it works, Meet your AI employees, Pricing, and FAQ sections are all present.' },
      { type: 'REQUIRED_OUTCOME', statement: 'All four pricing plan headings (Free, Starter, Growth, Pro) are visible.' },
      { type: 'REQUIRED_OUTCOME', statement: 'The "Get Your Free AI Audit" call-to-action button is visible.' },
      { type: 'MUST_PRESERVE', statement: 'The check targets https://planetlion.com.' },
    ],
  },
  code: { entrypoint: './homepage.spec.ts' },
})
