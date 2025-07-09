const { createHmac, randomBytes } = require('node:crypto');
const {Schema, model} = require('mongoose');
const { createToken } = require('../services/authentication');

const userSchema = new Schema({
  fullName:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true,
    unique: true
  },
  salt:{
    type: String,
  },
  password:{
    type: String,
    required: true
  },
  profileImageURL:{
    type: String,
    default:'/images/default.svg'
  },
  role:{
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER'
  }
},{ timestamps: true });

// Firslty whenever we try to save a user this function save the password in a hashed format
userSchema.pre('save', function(next) { // Middleware to hash password before saving
  const user = this;
  if(!user.isModified('password')) return; // if password is not modified, skip hashing
  const salt = randomBytes(16).toString() // generate a random salt or secret key
  const hashedPassword = createHmac('sha256', salt) // algorithm and key
  .update(user.password) 
  .digest('hex'); // hash the password

  this.salt = salt; // store the salt
  this.password = hashedPassword; // store the hashed password
  next(); // proceed to save the user
});

// Method to verify password
userSchema.static( 'verifyPasswordAndGenerateToken', async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }
  const salt = user.salt;
  const hashedPassword = user.password;
  const userProvidedHash = createHmac('sha256', salt) // algorithm and key
  .update(password) 
  .digest('hex');

  if (userProvidedHash !== hashedPassword) {
    throw new Error('Invalid password');
  }
  const token  = createToken(user);
  return token;
});


const User = model('user', userSchema);

module.exports = User;