import mongoose from "mongoose";
import dns from 'node:dns';
import { tenantPlugin } from './tenantPlugin';

mongoose.plugin(tenantPlugin);

const applyCustomDnsServers = () => {
  const rawServers = process.env.DNS_SERVERS;
  if (!rawServers) return;

  const servers = rawServers
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    dns.setServers(servers);
  }
};

const connectDB = async () => {
  try {
    applyCustomDnsServers();
    const conn = await mongoose.connect(process.env.MONGO_URI || "");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

export default connectDB;
