"""Validate the single published video configuration and derive native source links."""
import copy
import json
from urllib.parse import urlencode, urlsplit
import re


def validate_videos(config):
    providers = config.get('providers', {})
    videos = config.get('videos', {})
    if set(videos) != {'case', 'research'}:
        raise ValueError('Publish exactly the approved case and research videos')
    for name, provider in providers.items():
        if name != 'youtube':
            raise ValueError('Only the verified YouTube adapter is implemented')
        if not isinstance(provider.get('enabled'), bool):
            raise ValueError('Provider enabled must be boolean')
        for field in ('embedOrigin', 'apiUrl', 'watchUrl'):
            url = urlsplit(provider.get(field, ''))
            if url.scheme != 'https' or not url.netloc or url.username or url.fragment or url.query:
                raise ValueError('Video endpoints must be explicit HTTPS URLs')
            if field == 'embedOrigin' and url.path:
                raise ValueError('Embed origin cannot contain a path')
        if not isinstance(provider.get('loadTimeoutMs'), int) or not 1000 <= provider['loadTimeoutMs'] <= 60000:
            raise ValueError('Video load timeout must be between 1 and 60 seconds')
    for key, video in videos.items():
        if video.get('shape') != ('portrait' if key == 'case' else 'landscape'):
            raise ValueError('Keep the approved video aspect ratios')
        if video.get('durationSeconds', 0) <= 0:
            raise ValueError('Video duration must be positive')
        for language in ('en', 'zh'):
            source = video.get('sources', {}).get(language, {})
            if source.get('provider') not in providers or not re.fullmatch(r'[A-Za-z0-9_-]{11}', source.get('id', '')):
                raise ValueError('Each locale needs its own valid provider and video ID')
            if not video.get('titles', {}).get(language):
                raise ValueError('Each video needs a localized dialog title')
        for poster in video.get('posters', {}).values():
            if not re.fullmatch(r'assets/[A-Za-z0-9_-]+\.jpg', poster):
                raise ValueError('Posters must be local JPG assets')
    return config


def read_videos(path):
    return validate_videos(json.loads(path.read_text()))


def watch_url(config, key, language):
    source = config['videos'][key]['sources'][language]
    return config['providers'][source['provider']]['watchUrl'] + '?' + urlencode({'v': source['id']})


def locale_video_config(config, language, relative_asset):
    selected = copy.deepcopy(config)
    for key, video in selected['videos'].items():
        video['source'] = video.pop('sources')[language]
        video['title'] = video.pop('titles')[language]
        video['watchUrl'] = watch_url(config, key, language)
        posters = video.pop('posters', {})
        video['poster'] = relative_asset(posters[language]) if language in posters else None
    return selected
