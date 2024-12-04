# SCORM2CMS Prototype

**Note:** I set the project up to make it as easy to understand and navigate as possible. This may or may not have
worked. If anything is unclear, please let me know.

Every event handler the CMS can use is set up and documented in the `src/parent/parent-event-handlers.ts` file. I would
suggest using the `lmsCommitHandler` to store the current course data in the database.

The `fetchLmsData` and `storeLmsData` functions in the same file can be used to do the actual fetching and storing. It
currently uses the mock server I set up in the `server` folder. If you adjust the URLs in the `.env` file to point to
your server, this might already work out of the box.

If you have any questions, please do not hesitate to ask!

## Usage

**Clone the Repository**: Start by cloning this repository to your local machine.

```bash
git clone git@github.com:NicolasReibnitz/scorm2cms-prototype.git
```

**Install Dependencies**: Navigate into the project directory and install the necessary dependencies using npm or yarn.

```bash
npm install
```

## Configuration

You will have to add your server URLs to the `src/.env` file  
(`VITE_TRUSTED_DOMAINS`, `VITE_LMS_SERVER_FETCH`, `VITE_LMS_SERVER_STORE`).

Optionally you can also set a more secure secret token for the postMessage API bridge (`VITE_SECRET_TOKEN`).

Setting `devMode` to `false` in the `src/parent/parent.ts` file will remove the log table and buttons, as well as make
the iframe take up the whole width of the browser.

Adjusting `loggerSettings.logLevel` in `src/parent/parent.ts`, `src/parent/parent-event-handlers.ts`, and
`src/wrapper/wrapper.ts` will adjust the chatter in the console. Use `0` to turn the logger off and `3` to get the
default info.

## Development

**Start the mock LMS server** by running the following command:

```bash
npm run server
```

**Start the development server** by running the following command:

```bash
npm run dev
```

Once the server is running, you can access your application by navigating to http://localhost:5173/parent/index.html in
your web browser.

## Production Build

To generate a production build of your project, use:

```bash
npm run build
```

To preview the build, use:

```bash
npm run preview
```
