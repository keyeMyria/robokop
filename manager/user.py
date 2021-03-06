from flask_security import UserMixin, RoleMixin
from sqlalchemy.orm import relationship, backref
from sqlalchemy import Boolean, DateTime, Column, Integer, \
                       String, ForeignKey
from manager.setup import db

class RolesUsers(db.Model):
    __tablename__ = 'roles_users'
    id = Column(Integer, primary_key=True)
    user_id = Column('user_id', Integer, ForeignKey('user.id'))
    role_id = Column('role_id', Integer, ForeignKey('role.id'))

class Role(db.Model, RoleMixin):
    __tablename__ = 'role'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    description = Column(String)

class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    username = Column(String)
    password = Column(String)
    last_login_at = Column(DateTime)
    current_login_at = Column(DateTime)
    last_login_ip = Column(String)
    current_login_ip = Column(String)
    login_count = Column(Integer)
    active = Column(Boolean)
    confirmed_at = Column(DateTime)
    roles = relationship('Role', secondary='roles_users',
                          backref=backref('users', lazy='dynamic'))

    def toJSON(self):
        keys = [str(column).split('.')[-1] for column in self.__table__.columns]
        struct = {key:getattr(self, key) for key in keys}
        return struct

def get_user_by_id(id):
    return db.session.query(User)\
        .filter(User.id == id)\
        .first()

def list_users():
    return db.session.query(User)\
        .all()

def get_user_by_email(user_email):
    return db.session.query(User)\
        .filter(User.email == user_email)\
        .first()
