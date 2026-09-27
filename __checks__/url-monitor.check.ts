import { UrlMonitor, UrlAssertionBuilder, Frequency } from 'checkly/constructs'

new UrlMonitor('planetlion-url-monitor', {
  name: 'planetlion.com – URL availability',
  frequency: Frequency.EVERY_30S,
  locations: ['us-east-1', 'eu-west-1'],
  request: {
    url: 'https://planetlion.com',
    assertions: [
      UrlAssertionBuilder.statusCode().equals(200),
    ],
  },
  intent: {
    goal: 'Ensure planetlion.com is reachable and responds with a successful status code.',
    constraints: [
      { type: 'REQUIRED_OUTCOME', statement: 'https://planetlion.com responds with HTTP status 200.' },
    ],
  },
})
