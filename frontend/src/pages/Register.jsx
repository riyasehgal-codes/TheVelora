// Register.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";


function Register() {

  // ==========================================
  // FORM STATE
  // ==========================================

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // Stores registration errors.
  const [error, setError] = useState("");

  // Controls password visibility.
  const [showPassword, setShowPassword] =
    useState(false);

  // Used to redirect after successful registration.
  const navigate = useNavigate();


  // ==========================================
  // HANDLE INPUT CHANGES
  // ==========================================

  const handleChange = (event) => {

    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

  };


  // ==========================================
  // HANDLE REGISTRATION
  // ==========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    // Clear previous error.
    setError("");

    try {

      // Send registration details to Django.
      await api.post(
        "/register/",
        formData
      );


      // Registration successful.
      // Send the user to the login page.
      navigate("/login");

    } catch (err) {

      console.error(
        "Registration error:",
        err
      );


      // Try to display Django's error.
      if (err.response?.data) {

        const data =
          err.response.data;


        if (data.username) {

          setError(
            Array.isArray(data.username)
              ? data.username[0]
              : data.username
          );

        } else if (data.email) {

          setError(
            Array.isArray(data.email)
              ? data.email[0]
              : data.email
          );

        } else if (data.password) {

          setError(
            Array.isArray(data.password)
              ? data.password[0]
              : data.password
          );

        } else {

          setError(
            "Unable to create your account."
          );

        }

      } else {

        setError(
          "Unable to create your account."
        );

      }

    }

  };


  return (

    /*
     * Full-screen authentication page.
     */

    <div
      className="
        fixed
        inset-0
        min-h-screen
        w-screen
        overflow-y-auto
        overflow-x-hidden
        bg-[#020617]
        text-white
      "
    >


      {/* =====================================
          BACKGROUND EFFECTS
          ===================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
      >

        {/* Large glowing curve */}

        <div
          className="
            absolute
            -bottom-[390px]
            -left-[170px]
            h-[700px]
            w-[700px]
            rounded-full
            border
            border-blue-600/50
            shadow-[0_0_90px_rgba(37,99,235,0.45)]
          "
        />


        {/* Second subtle curve */}

        <div
          className="
            absolute
            -bottom-[440px]
            -left-[220px]
            h-[700px]
            w-[700px]
            rounded-full
            border
            border-indigo-600/20
          "
        />


        {/* Right-side glow */}

        <div
          className="
            absolute
            -right-[250px]
            top-[100px]
            h-[600px]
            w-[600px]
            rounded-full
            bg-indigo-900/10
            blur-3xl
          "
        />

      </div>


      {/* =====================================
          LOGIN LINK — TOP RIGHT
          ===================================== */}

      <div
        className="
          absolute
          right-8
          top-7
          z-30
          text-sm
          sm:right-10
          lg:right-12
          xl:right-16
        "
      >

        <span className="text-slate-500">
          Already have an account?
        </span>

        <Link
          to="/login"
          className="
            ml-3
            font-medium
            text-indigo-400
            transition
            hover:text-indigo-300
          "
        >
          Log in
        </Link>

      </div>


      {/* =====================================
          MAIN TWO-COLUMN LAYOUT
          ===================================== */}

      <div
        className="
          relative
          z-10
          grid
          min-h-screen
          w-full
          grid-cols-1
          lg:grid-cols-2
        "
      >


        {/* ===================================
            LEFT SIDE
            =================================== */}

        <section
          className="
            relative
            hidden
            min-h-screen
            border-r
            border-slate-800/70
            lg:flex
            lg:flex-col
            lg:justify-between
            px-16
            py-14
            xl:px-24
            2xl:px-32
          "
        >


          {/* =================================
              LOGO
              ================================= */}

          <div>

            <div className="flex items-center gap-4">


              {/* Velora V logo */}

              <div
                className="
                  h-10
                  w-11
                  shrink-0
                "
              >

                <svg
                  viewBox="0 0 100 90"
                  className="h-full w-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >

                  <defs>

                    <linearGradient
                      id="veloraLogoGradient"
                      x1="20"
                      y1="5"
                      x2="75"
                      y2="85"
                      gradientUnits="userSpaceOnUse"
                    >

                      <stop
                        offset="0%"
                        stopColor="#3B82F6"
                      />

                      <stop
                        offset="48%"
                        stopColor="#6366F1"
                      />

                      <stop
                        offset="100%"
                        stopColor="#A855F7"
                      />

                    </linearGradient>

                  </defs>


                  <path
                    d="
                      M 5 5
                      L 28 5
                      L 50 43
                      L 72 5
                      L 95 5
                      L 61 70
                      Q 50 88 39 70
                      Z
                    "
                    fill="url(#veloraLogoGradient)"
                  />

                </svg>

              </div>


              {/* Velora wordmark */}

              <span
                className="
                  text-lg
                  font-medium
                  tracking-[0.38em]
                  text-slate-200
                "
              >
                VELORA
              </span>

            </div>


            {/* =================================
                HERO CONTENT
                ================================= */}

            <div
              className="
                mt-28
                max-w-[520px]
              "
            >

              <h1
                className="
                  font-serif
                  text-5xl
                  leading-[1.08]
                  text-slate-100
                  xl:text-[54px]
                "
              >
                Start Your
              </h1>


              <h2
                className="
                  mt-1
                  bg-gradient-to-r
                  from-blue-400
                  via-indigo-400
                  to-purple-500
                  bg-clip-text
                  font-serif
                  text-5xl
                  leading-[1.08]
                  text-transparent
                  xl:text-[54px]
                "
              >
                Investing Journey.
              </h2>


              <p
                className="
                  mt-8
                  max-w-[410px]
                  text-[15px]
                  leading-6
                  text-slate-400
                "
              >
                Build your portfolio, track your investments,
                and discover smarter ways to understand the market.
              </p>


              {/* =================================
                  FEATURES
                  ================================= */}

              <div className="mt-12 space-y-7">


                {/* Feature 1 */}

                <div
                  className="
                    flex
                    items-start
                    gap-5
                  "
                >

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-indigo-500/40
                      bg-indigo-950/30
                    "
                  >

                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-indigo-400"
                    >

                      <path
                        d="M3 17l6-6 4 4 8-9"
                      />

                      <path
                        d="M17 6h4v4"
                      />

                    </svg>

                  </div>


                  <div>

                    <p
                      className="
                        text-sm
                        font-medium
                        text-slate-200
                      "
                    >
                      Real-Time Insights
                    </p>

                    <p
                      className="
                        mt-1
                        max-w-[300px]
                        text-xs
                        leading-5
                        text-slate-500
                      "
                    >
                      Track your investments with
                      live market information.
                    </p>

                  </div>

                </div>


                {/* Feature 2 */}

                <div
                  className="
                    flex
                    items-start
                    gap-5
                  "
                >

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-indigo-500/40
                      bg-indigo-950/30
                    "
                  >

                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-indigo-400"
                    >

                      <path
                        d="M12 3v18"
                      />

                      <path
                        d="M17 7H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7"
                      />

                    </svg>

                  </div>


                  <div>

                    <p
                      className="
                        text-sm
                        font-medium
                        text-slate-200
                      "
                    >
                      Portfolio Tracking
                    </p>

                    <p
                      className="
                        mt-1
                        max-w-[300px]
                        text-xs
                        leading-5
                        text-slate-500
                      "
                    >
                      Keep all your holdings and
                      performance data in one place.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* =================================
              BOTTOM LABEL
              ================================= */}

          <p
            className="
              text-[10px]
              font-medium
              tracking-[0.4em]
              text-indigo-400/60
            "
          >
            INVEST / TRACK / GROW
          </p>

        </section>


        {/* ===================================
            RIGHT SIDE — REGISTER
            =================================== */}

        <section
          className="
            relative
            flex
            min-h-screen
            items-center
            justify-center
            px-8
            py-28
            sm:px-12
            lg:px-16
            xl:px-24
            2xl:px-32
          "
        >

          <div
            className="
              w-full
              max-w-[500px]
            "
          >


            {/* =================================
                HEADER
                ================================= */}

            <div className="mb-10">

              <p
                className="
                  text-[11px]
                  font-medium
                  tracking-[0.28em]
                  text-slate-500
                "
              >
                GET STARTED
              </p>


              <h2
                className="
                  mt-4
                  font-serif
                  text-4xl
                  leading-tight
                  text-slate-100
                  xl:text-[42px]
                "
              >
                Create your Velora account
              </h2>


              <p
                className="
                  mt-3
                  text-sm
                  text-slate-500
                "
              >
                Start tracking your portfolio.
              </p>

            </div>


            {/* =================================
                ERROR MESSAGE
                ================================= */}

            {error && (

              <div
                className="
                  mb-5
                  rounded-xl
                  border
                  border-red-500/20
                  bg-red-500/10
                  px-4
                  py-3
                  text-sm
                  text-red-400
                "
              >
                {error}
              </div>

            )}


            {/* =================================
                REGISTRATION FORM
                ================================= */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >


              {/* USERNAME */}

              <div className="relative">

                <div
                  className="
                    pointer-events-none
                    absolute
                    left-5
                    top-1/2
                    -translate-y-1/2
                    text-slate-500
                  "
                >

                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >

                    <circle
                      cx="12"
                      cy="8"
                      r="3"
                    />

                    <path
                      d="M5 21c.8-4 3-6 7-6s6.2 2 7 6"
                    />

                  </svg>

                </div>


                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="
                    h-[54px]
                    w-full
                    rounded-xl
                    border
                    border-indigo-900/70
                    bg-transparent
                    pl-14
                    pr-5
                    text-sm
                    text-slate-200
                    outline-none
                    placeholder:text-slate-500
                    transition
                    focus:border-indigo-500
                    focus:ring-1
                    focus:ring-indigo-500/30
                  "
                />

              </div>


              {/* EMAIL */}

              <div className="relative">

                <div
                  className="
                    pointer-events-none
                    absolute
                    left-5
                    top-1/2
                    -translate-y-1/2
                    text-slate-500
                  "
                >

                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >

                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                    />

                    <path
                      d="M3 7l9 6 9-6"
                    />

                  </svg>

                </div>


                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="
                    h-[54px]
                    w-full
                    rounded-xl
                    border
                    border-indigo-900/70
                    bg-transparent
                    pl-14
                    pr-5
                    text-sm
                    text-slate-200
                    outline-none
                    placeholder:text-slate-500
                    transition
                    focus:border-indigo-500
                    focus:ring-1
                    focus:ring-indigo-500/30
                  "
                />

              </div>


              {/* PASSWORD */}

              <div className="relative">

                <div
                  className="
                    pointer-events-none
                    absolute
                    left-5
                    top-1/2
                    -translate-y-1/2
                    text-slate-500
                  "
                >

                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >

                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="11"
                      rx="2"
                    />

                    <path
                      d="M8 10V7a4 4 0 018 0v3"
                    />

                  </svg>

                </div>


                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="
                    h-[54px]
                    w-full
                    rounded-xl
                    border
                    border-indigo-900/70
                    bg-transparent
                    pl-14
                    pr-14
                    text-sm
                    text-slate-200
                    outline-none
                    placeholder:text-slate-500
                    transition
                    focus:border-indigo-500
                    focus:ring-1
                    focus:ring-indigo-500/30
                  "
                />


                {/* Password visibility */}

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="
                    absolute
                    right-5
                    top-1/2
                    -translate-y-1/2
                    text-slate-500
                    transition
                    hover:text-slate-300
                  "
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (

                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >

                      <path
                        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                      />

                    </svg>

                  ) : (

                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >

                      <path
                        d="M3 3l18 18"
                      />

                      <path
                        d="M10.6 6.2A9.8 9.8 0 0112 6c6.5 0 10 6 10 6a18 18 0 01-3.1 3.8"
                      />

                      <path
                        d="M6.1 6.1C3.4 8.2 2 12 2 12s3.5 6 10 6c1.5 0 2.8-.3 4-.8"
                      />

                      <path
                        d="M10 10a2.8 2.8 0 004 4"
                      />

                    </svg>

                  )}

                </button>

              </div>


              {/* =================================
                  CREATE ACCOUNT BUTTON
                  ================================= */}

              <button
                type="submit"
                className="
                  group
                  mt-2
                  flex
                  h-[54px]
                  w-full
                  items-center
                  justify-center
                  gap-3
                  rounded-xl
                  bg-gradient-to-r
                  from-blue-500
                  via-indigo-500
                  to-purple-600
                  text-sm
                  font-medium
                  text-white
                  shadow-[0_0_30px_rgba(79,70,229,0.25)]
                  transition
                  hover:shadow-[0_0_40px_rgba(79,70,229,0.4)]
                  active:scale-[0.99]
                "
              >

                Create Account

                <span
                  className="
                    text-lg
                    transition-transform
                    group-hover:translate-x-1
                  "
                >
                  →
                </span>

              </button>

            </form>


            {/* =================================
                LOGIN LINK
                ================================= */}

            <p
              className="
                mt-7
                text-center
                text-sm
                text-slate-500
              "
            >

              Already have an account?

              <Link
                to="/login"
                className="
                  ml-2
                  text-indigo-400
                  transition
                  hover:text-indigo-300
                "
              >
                Log in
              </Link>

            </p>


            {/* =================================
                MOBILE SIGN IN
                ================================= */}

            <p
              className="
                mt-8
                text-center
                text-xs
                text-slate-600
                lg:hidden
              "
            >
              Velora — Invest / Track / Grow
            </p>

          </div>

        </section>

      </div>

    </div>

  );

}


export default Register;