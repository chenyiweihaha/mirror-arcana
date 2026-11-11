import io
import json
import unittest
from email.message import Message
from unittest.mock import patch
import server


class ServerTests(unittest.TestCase):
    def handler(self, **headers):
        h = server.Handler.__new__(server.Handler)
        h.headers = Message()
        h.headers['Host'] = '127.0.0.1:8000'
        for name, value in headers.items(): h.headers[name] = value
        h.path = '/api/interpret'
        h.respond = lambda status, body: (status, body)
        return h

    def test_cross_origin_and_dns_rebinding_blocked(self):
        h = self.handler(Origin='https://other.example')
        self.assertFalse(h.allowed())
        h = self.handler()
        h.headers.replace_header('Host', 'attacker.example:8000')
        self.assertFalse(h.allowed())

    def test_missing_token_rejected_without_model_request(self):
        h = self.handler()
        with patch('server.interpret') as model:
            self.assertEqual(h.do_POST()[0], 403)
            model.assert_not_called()

    def test_valid_request_and_invalid_json(self):
        h = self.handler(**{'Content-Type': 'application/json', 'X-CSRF-Token': server.TOKEN})
        h.headers['Content-Length'] = '2'
        h.rfile = io.BytesIO(b'{}')
        responses = []
        h.respond = lambda status, body: responses.append((status, body))
        with patch('server.interpret', return_value={'sections': []}): h.do_POST()
        self.assertEqual(responses[0][0], 200)
        h.rfile = io.BytesIO(b'xx')
        h.do_POST()
        self.assertEqual(responses[-1][0], 400)

    def test_config_exposes_provider_but_never_credentials(self):
        h = self.handler()
        h.path = '/api/config'
        with patch('server.provider_config', return_value={'provider':'openai', 'label':'OpenAI',
                'model':'gpt-5.4-mini','configured':True,'key':'private-test-only'}):
            status, body = h.do_GET()
        self.assertEqual(status, 200)
        self.assertEqual(body['provider'], 'openai')
        self.assertNotIn('private-test-only', json.dumps(body))
        self.assertNotIn('key', body)
