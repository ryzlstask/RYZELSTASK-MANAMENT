const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');

async function main() {
  const token = process.env.GITHUB_TOKEN || process.argv[2];
  if (!token) {
    throw new Error('Please provide GITHUB_TOKEN as an environment variable or argument.');
  }
  const repoUrl = 'https://github.com/ryzelsdigital-wq/Task-Management-Ryzels.git';

  console.log('[1/5] Initializing git repository...');
  await git.init({ fs, dir: '.', defaultBranch: 'main' });

  console.log('[2/5] Reading files according to .gitignore...');
  const matrix = await git.statusMatrix({ fs, dir: '.' });
  console.log(`Found ${matrix.length} files to track.`);

  console.log('[3/5] Staging files...');
  for (const [filepath] of matrix) {
    await git.add({ fs, dir: '.', filepath });
  }

  console.log('[4/5] Creating commit...');
  const sha = await git.commit({
    fs,
    dir: '.',
    message: 'Initial commit: Complete Ryzels Task Manager & Operations Workspace with WhatsApp Multi-Device',
    author: {
      name: 'Talha Khan',
      email: 'talha.khan@ryzels.com'
    }
  });
  console.log('Committed with SHA:', sha);

  console.log('[4.5/5] Creating and checking out main branch...');
  await git.branch({ fs, dir: '.', ref: 'main', checkout: true });
  await git.writeRef({ fs, dir: '.', ref: 'HEAD', value: 'refs/heads/main', force: true, symbolic: true });

  console.log('[5/5] Pushing to GitHub (main branch)...');
  const pushResult = await git.push({
    fs,
    http,
    dir: '.',
    url: repoUrl,
    ref: 'main',
    remoteRef: 'main',
    force: true,
    onAuth: () => ({
      username: token,
      password: ''
    })
  });

  console.log('Push Result:', pushResult);
  console.log('SUCCESS! Code successfully pushed to https://github.com/ryzelsdigital-wq/Task-Management-Ryzels.git');
}

main().catch(err => {
  console.error('Push failed:', err);
  process.exit(1);
});
