// prisma.config.ts


export default {
  datasource: {
    db: {
      provider: "sqlite",
      url: "file:./dev.db"
    }
  },
};