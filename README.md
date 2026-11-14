# bocchio.dev

This is the source code for [bocchio.dev](https://bocchio.dev), a personal website that serves as a portfolio and central hub for managing web-app and services developed by me.

The idea is to have a centralized place from which I can easily integrate and manage all the different projects, apps, and services I have developed over the years, and to provide a single point of access for users to discover and interact with them.
Moreover, as some of the services provided are, in general, useful not only to me but also to other people, I want to make them available to everyone.
For these reasons, the website is splitted into a public and an user-only section, where the public section is open to everyone and provides free-access to a collection of tools, utilities, and sometimes even games, while the user-only section is reserved to registered users and provides access to SaaS services that I've developed for me but decided to make available to other people as well.


## Tech Stack

The website is built on a frontend/backend architecture.
The frontend is built using `SvelteKit`, adopting `Shadcn UI` as the main UI library, and is written in `TypeScript`.
The backend is built using `Laravel`, and is written in `PHP`.
The two parts are connected through a classic `REST API`.

As for the hosting, the frontend is hosted on `Netlify`, while the backend is hosted in a `DigitalOcean Droplet` running `Ubuntu 22.04 LTS`, with `Nginx` as the web server and `MySQL` as the database.


## Apps

The public section is also home to small apps, like [Fourier Drawing](https://bocchio.dev/apps/fourier-drawing) and [Chladni Plates](https://bocchio.dev/apps/chladni-plates), that run entirely in the browser: they don't use the API, they don't store anything on the server, and the few external services they may need (for example to download a picture) are called directly from the client.
Each app lives in three places, all named after the app:

- `src/routes/(contents)/apps/<app>/`: the page, prerendered like the rest of the public section;
- `src/components/apps/<app>/`: the user interface, made of Shadcn components;
- `src/lib/apps/<app>/`: the logic, which avoids depending on the DOM unless it has to, together with its tests (run them with `npx vitest`).

What two apps need is in `src/components/apps/`, next to their folders (the labelled slider and `app-page.svelte`, the title and the text around every app, for instance).

The apps listed in `/apps` are managed from the CMS, like projects and blog posts, so a new app needs its entry there too (type *app*):

- the **slug** of the entry is the name of the folder of the app in `src/routes/(contents)/apps/`: the card in `/apps`, the page and the sitemap find each other that way, and the `+page.ts` of the app asks the CMS for that slug (`loadApp` in `src/lib/utils/cms.ts`);
- the **title** and the **excerpt** are the title and the subtitle, on the card and on top of the page; the **body**, in markdown, is the text under the app, so nothing is written in the page itself;
- the pictures are files of the site, `static/images/apps/<slug>.gif` (the animation of the card) and `static/images/apps/<slug>.jpg` (still, for the social networks), listed in `meta.headerImages` of the entry.

The entries of the apps are in `AppsSeeder` of the API, which puts them back as many times as it is run (`php artisan db:seed --class='Database\Seeders\Cms\AppsSeeder'`, with `--force` in production).
The pages are prerendered from the CMS, so the entries have to be there before the site is built.

The land of the globe of [Distance Explorer](https://bocchio.dev/apps/distance-explorer) is `src/lib/apps/distance-explorer/land.ts`, a map made of cells that `scripts/land-mask.mjs` works out from the public domain Natural Earth data: the script is only run to make the map again (how is in its first lines), so the data is not a dependency of the site.


## Contributing

If you want to contribute to the project, feel free to open a pull request or an issue on GitHub.
Service requests and bug reports are always welcome.
Given that this is a personal project, I cannot guarantee that all contributions will be accepted, but I will do my best to review and merge them as soon as possible.


Have a nice coding day,

Tommaso :panda_face: