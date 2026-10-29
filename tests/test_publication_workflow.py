"""Exercise the workflow's shell routing without installing packages or deploying."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

import yaml


class PublicationWorkflowTests(unittest.TestCase):
    def test_personal_acceptance_and_official_publication_are_isolated(self):
        workflow = yaml.safe_load(Path('.github/workflows/publish.yml').read_text())
        step = next(step for step in workflow['jobs']['build']['steps']
                    if step.get('id') == 'publication')
        cases = [
            ('aelf-hzz780', 'push', 'refs/heads/feature/approved-home-bilingual-seo', True),
            ('aelf-hzz780', 'workflow_dispatch', 'refs/heads/feature/approved-home-bilingual-seo', True),
            ('aelf-hzz780', 'push', 'refs/heads/main', True),
            ('aelf-hzz780', 'workflow_dispatch', 'refs/heads/main', True),
            ('ChronoAIProject', 'push', 'refs/heads/main', False),
            ('ChronoAIProject', 'workflow_dispatch', 'refs/heads/main', False),
        ]
        for owner, event, ref, preview in cases:
            with self.subTest(owner=owner, event=event, ref=ref), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                python = root / 'python'
                python.write_text('#!/bin/sh\nprintf "%s|%s|%s\\n" "$*" "${SITE_ORIGIN-}" "${SITE_BASE_PATH-}" >> "$ROUTE_LOG"\n')
                python.chmod(0o755)
                env = {key: value for key, value in os.environ.items()
                       if key not in ('SITE_ORIGIN', 'SITE_BASE_PATH')}
                env.update(PATH=directory + os.pathsep + env['PATH'],
                           GITHUB_EVENT_NAME=event, GITHUB_REF=ref,
                           GITHUB_REPOSITORY_OWNER=owner,
                           GITHUB_REPOSITORY=owner + '/chronoai-site',
                           GITHUB_OUTPUT=str(root / 'output'), ROUTE_LOG=str(root / 'calls'))
                subprocess.run(['bash', '-e', '-o', 'pipefail', '-c', step['run']],
                               env=env, check=True, capture_output=True, text=True)
                calls = (root / 'calls').read_text().splitlines()
                if preview:
                    self.assertEqual(calls[-2:], [
                        'scripts/build.py --preview|https://aelf-hzz780.github.io|/chronoai-site/',
                        'tests/verify_site.py _preview|https://aelf-hzz780.github.io|/chronoai-site/',
                    ])
                    self.assertEqual((root / 'output').read_text().strip(), 'directory=_preview')
                else:
                    self.assertEqual(calls[-2:], ['scripts/build.py||', 'tests/verify_site.py||'])
                    self.assertEqual((root / 'output').read_text().strip(), 'directory=_site')


if __name__ == '__main__':
    unittest.main()
