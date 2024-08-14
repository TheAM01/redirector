class Link {
    constructor(endpoint, path) {
        this.endpoint = `/${endpoint}`;
        this.path = `https://${path}`;
    }
}


export default {
    Home: "/",
    Portfolio: "/portfolio",
    All: [
        new Link('discord', 'discord.gg/VJ8jHWTj4K'),
        new Link('instagram', 'instagram.com/abdulmueed.wav'),
        new Link('github', 'github.com/TheAM01'),
        new Link('spotify', 'open.spotify.com/artist/2CTBnkHNgYSjaXtnHiIXAA?si=iC81rf7GSU6xbZQ31212qA'),
        new Link('solid-pixel', 'solidpixelnashe.glitch.me'),
        new Link('pfh', 'parhle.glitch.me')
    ]
}