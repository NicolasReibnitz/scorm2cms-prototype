const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5174;

// Middleware to parse JSON body
app.use(express.json());

// Middleware to handle CORS
app.use((_req, res, next) => {
	res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
});

const filePath = path.join(__dirname, 'data.json');

// Endpoint to overwrite data
app.post('/api/lms/commit', (req, res) => {
	const data = req.body;
	if (!data) {
		return res.status(400).json({ error: 'No data provided' });
	}

	// Overwrite the file with the new object
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

	res.status(200).json({ message: 'Data saved successfully', data });
});

// Endpoint to retrieve data
app.get('/api/lms/data', (_req, res) => {
	// Check if file exists and read it
	if (fs.existsSync(filePath)) {
		const fileContent = fs.readFileSync(filePath, 'utf-8');
		const data = JSON.parse(fileContent || null);
		return res.status(200).json(data);
	} else {
		return res.status(200).json({}); // No data file yet
	}
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
