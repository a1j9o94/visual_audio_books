// File: app/api/log/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  const { bookName, logType, data } = await request.json();

  if (!bookName || !logType || !data) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const logDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logDir, { recursive: true });

    const filePath = path.join(logDir, 'log.txt');

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      bookName,
      logType,
      data
    };

    await fs.appendFile(filePath, JSON.stringify(logEntry, null, 2) + '\n');

    return NextResponse.json({ success: true, filePath });
  } catch (error) {
    console.error('Error writing log:', error);
    return NextResponse.json({ error: 'Failed to write log' }, { status: 500 });
  }
}