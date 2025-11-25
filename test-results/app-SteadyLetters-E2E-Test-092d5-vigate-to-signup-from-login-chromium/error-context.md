# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e3]:
      - link "SteadyLetters" [ref=e4] [cursor=pointer]:
        - /url: /
      - generic [ref=e5]:
        - link "Sign In" [ref=e6] [cursor=pointer]:
          - /url: /login
        - link "Sign Up" [active] [ref=e7] [cursor=pointer]:
          - /url: /signup
  - main [ref=e8]:
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Create an Account
        - generic [ref=e13]: Sign up to start creating AI-powered letters
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: Email
          - textbox "Email" [ref=e18]:
            - /placeholder: you@example.com
        - generic [ref=e19]:
          - generic [ref=e20]: Password
          - textbox "Password" [ref=e21]:
            - /placeholder: ••••••••
          - paragraph [ref=e22]: Must be at least 6 characters
        - button "Sign Up" [ref=e23]
        - paragraph [ref=e24]:
          - text: Already have an account?
          - link "Log in" [ref=e25] [cursor=pointer]:
            - /url: /login
  - button "Open Next.js Dev Tools" [ref=e31] [cursor=pointer]:
    - img [ref=e32]
  - alert [ref=e35]
```