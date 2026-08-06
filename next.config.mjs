/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "3000-cs-153365856612-default.cs-europe-west1-xedi.cloudshell.dev",
  ],

  serverActions: {
    bodySizeLimit: "6mb",
  },
};

export default nextConfig;
