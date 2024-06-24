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
    const sanitizedBookName = bookName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const logDir = path.join(process.cwd(), 'logs', sanitizedBookName);
    await fs.mkdir(logDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const fileName = `${logType}_${timestamp}.json`;
    const filePath = path.join(logDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, filePath });
  } catch (error) {
    console.error('Error writing log:', error);
    return NextResponse.json({ error: 'Failed to write log' }, { status: 500 });
  }
}