class Link {
    constructor(endpoint, path) {
        this.endpoint = `/${endpoint}`;
        this.path = `http://${path}`;
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
        new Link('solid-pixel', '194.164.125.5:6024/'),
        new Link('pfh', 'parhle.glitch.me'),
        new Link("unreleased", "drive.google.com/drive/u/4/folders/16BfK1RS1Ybqcy22eweRqe8VSIoE5Wso0")
    ]
}