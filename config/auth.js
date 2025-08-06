import { Strategy as LocalStrategy } from "passport-local";
import Usuario from "../models/Usuario.js";
import bcrypt from "bcryptjs";

export default function configurePassport(passport) {
    passport.use(new LocalStrategy({ usernameField: "email", passwordField: "senha" }, (email, senha, done) => {
        Usuario.findOne({ email: email }).then((usuario) => {
            if (!usuario) {
                return done(null, false, { message: "Essa conta não existe" })
            }

            if (!usuario.senha) {
                return done(null, false, { message: "Senha não encontrada no banco." })
            }

            bcrypt.compare(senha, usuario.senha, (err, result) => {
                if (err) return done(err)
                if (result) {
                    return done(null, usuario)
                } else {
                    return done(null, false, { message: "Senha incorreta" })
                }
            })
        }).catch(err => done(err))
    }));

    passport.serializeUser((usuario, done) => {
        done(null, usuario._id);
    });

    passport.deserializeUser((id, done) => {
        Usuario.findById(id).then((usuario) => {
            done(null, usuario);
        }).catch((err) => {
            done(err, null);
        });
    });
}
