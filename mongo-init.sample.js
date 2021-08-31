db.createUser(
    {
        user: "pohlesuser",
        pwd: "examplepass",
        roles: [
            {
                role: "readWrite",
                db: "pohles"
            }
        ]
    }
);