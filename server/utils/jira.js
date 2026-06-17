// Jira integration utility using native fetch

const createJiraIssue = async ({ summary, description, issueType = 'Task' }) => {
  const { JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY } = process.env;

  // If Jira isn't configured, silently skip (useful for local dev)
  if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
    console.log('Jira environment variables not configured. Skipping Jira ticket creation.');
    return null;
  }

  const authString = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

  const bodyData = {
    fields: {
      project: {
        key: JIRA_PROJECT_KEY
      },
      summary: summary,
      description: description,
      issuetype: {
        name: issueType
      }
    }
  };

  try {
    const response = await fetch(`${JIRA_URL}/rest/api/2/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Jira API Error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`Successfully created Jira ticket: ${data.key}`);
    return data;
  } catch (error) {
    console.error('Exception creating Jira ticket:', error.message);
    return null;
  }
};

module.exports = { createJiraIssue };
