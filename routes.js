import Routes from "./routes.config.js";

export default async function createRoutes(app, dir) {
    
    app.get(Routes.Home, (req, res) => {
        res.redirect("https://me.mueed.xyz");
    });

    app.get(Routes.Portfolio, (req, res) => {
        res.redirect("https://portfolio.mueed.xyz");
    });

    Routes.All.forEach((route => {
        app.get(route.endpoint, (req, res) => {
          res.redirect(route.path);
        })
    }));

}