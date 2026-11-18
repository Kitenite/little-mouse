// Print a reusable worker prompt; never creates sessions or modifies workspaces.
import { readFileSync } from 'node:fs';
const config = JSON.parse(readFileSync(new URL('./roles.json', import.meta.url), 'utf8'));
const [id, ...objective] = process.argv.slice(2);
if (!id || id === '--list') {
  console.log(config.roles.map(role => `${role.id}: ${role.objective}`).join('\n'));
} else {
  const role = config.roles.find(role => role.id === id);
  if (!role) {
    console.error(`Unknown role: ${id}. Use --list.`);
    process.exitCode = 1;
  } else {
    console.log([
      `Role: ${role.id} (${role.kind})`,
      `Objective: ${role.objective}`,
      objective.length ? `Assigned task: ${objective.join(' ')}` : 'Coordinator must supply a bounded task before dispatch.',
      `Owned source paths: ${role.owns.join(', ') || 'none; independent review'}`,
      `Read: ${role.requirements.join(', ')}`,
      `Current evidence and next queue: ${role.report}`,
      role.critic ? `Delegate independent review to ${role.critic}; coordinate with ${role.coordinateWith.join(', ')}.` : `Review target: ${role.reviews || 'combined integrated build'}.`,
      ...config.contract.map((rule, index) => `${index + 1}. ${rule}`),
    ].join('\n\n'));
  }
}
