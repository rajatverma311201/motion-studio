/**
 * The running story for the encoding / hashing / signing / encryption video.
 * Pure data, so `story.test.ts` can check it without Motion Canvas.
 */

/** One participant in the running story. */
export interface StoryActor {
  id: string;
  label: string;
}

/** Alice sends, Eve listens, the bank receives. */
export const ACTORS: readonly StoryActor[] = [
  {id: 'alice', label: 'ALICE'},
  {id: 'eve', label: 'EVE'},
  {id: 'bank', label: 'BANK'},
];

/** One of the four separate needs from chapter 1. */
export interface ProblemCard {
  id: 'format' | 'secrecy' | 'integrity' | 'authenticity';
  title: string;
  question: string;
}

/** Format, secrecy, integrity and authenticity. */
export const PROBLEM_CARDS: readonly ProblemCard[] = [
  {id: 'format', title: 'FORMAT', question: 'Can the system carry it?'},
  {id: 'secrecy', title: 'SECRECY', question: 'Can Eve read it?'},
  {id: 'integrity', title: 'INTEGRITY', question: 'Can Eve change it?'},
  {id: 'authenticity', title: 'AUTHENTICITY', question: 'Is it really from Alice?'},
];

/** A myth and the truth that replaces it. */
export interface Myth {
  myth: string;
  truth: string;
}

/** The five myths from chapter 8. */
export const MYTHS: readonly Myth[] = [
  {myth: 'Base64 is encryption', truth: 'Base64 is encoding: reversible by anyone'},
  {myth: 'A hash is encrypted data', truth: 'A hash cannot be reversed, but it is not secret either'},
  {myth: 'Signed means secret', truth: 'Signed data is readable; the signature only proves it is intact'},
  {
    myth: 'Encrypted means unchangeable',
    truth: 'Without an authentication tag, ciphertext can be altered; use AES-GCM',
  },
  {myth: 'More encoding is more secure', truth: 'Encoding twice is still encoding'},
];

/** Columns of the closing recap matrix. */
export const RECAP_COLUMNS = ['Needs a key?', 'Reversible?', 'Hides content?', 'Detects change?'] as const;

/** The four tools, one row each, in the order the video introduces them. */
export const RECAP_ROWS = [
  {label: 'ENCODING', cells: ['no', 'yes', 'no', 'no']},
  {label: 'HASHING', cells: ['no', 'no', 'no', 'yes (but anyone can recompute)']},
  {label: 'SIGNING', cells: ['yes', 'no', 'no', 'yes']},
  {label: 'ENCRYPTION', cells: ['yes', 'yes', 'yes', 'only with an authentication tag']},
] as const;

/** Columns of the real-systems table in chapter 7. */
export const SYSTEM_COLUMNS = ['ENCODING', 'HASHING', 'SIGNING', 'ENCRYPTION'] as const;

/** Which tool each real system uses. A dash means the tool is not involved. */
export const SYSTEM_ROWS = [
  {label: 'HTTPS', cells: ['—', '—', '✓ certificate', '✓ AES-GCM']},
  {label: 'JWT', cells: ['✓ Base64URL', '—', '✓ HMAC or key pair', '— (JWE is rare)']},
  {label: 'Passwords', cells: ['—', '✓ slow + salted', '—', '— never encrypted']},
  {label: 'Software updates', cells: ['—', '✓ checksum', '✓ signature', '—']},
  {label: 'Disk encryption', cells: ['—', '—', '—', '✓ AES + passphrase']},
  {label: 'AES-GCM', cells: ['—', '—', '✓ auth tag', '✓ ciphertext']},
] as const;

/** Every caption in the video, one list per chapter, in order. */
export const CAPTIONS = {
  intro: [
    'Encoding, hashing, signing, encryption. They sound alike.',
    'They solve four completely different problems.',
    'Let us send one message and see what each one does.',
  ],
  problem: [
    'Alice sends an instruction to her bank. Eve sits on the network in between.',
    'Eve can read it. She can change it. She can pretend to be Alice.',
    'Format, secrecy, integrity, authenticity: four different problems.',
    'Each tool we meet solves one of them. None solves all four.',
  ],
  encoding: [
    'Encoding turns data into another format so systems can carry it.',
    'pay 500 to Bob becomes text made of safe letters. That is Base64.',
    'There is no key. The rules are public, so anyone can reverse it.',
    'Hex, URL encoding and UTF-8 work the same way: format, not secrecy.',
    'HTTP Basic auth is just Base64 of user:password. Decoding it takes one step.',
    'Encoding protects nothing. It only makes data fit.',
  ],
  hashing: [
    'A hash turns any input into a short, fixed-size fingerprint.',
    'Same input, same fingerprint. Always.',
    'Change 500 to 900 and about half the bits flip. That is the avalanche effect.',
    'You cannot run it backwards. A hash is one-way, so it is not encryption.',
    'Hashes catch accidents, like a corrupted download.',
    'But anyone can recompute a hash, so Eve can change the message and the hash.',
    'To stop her, the fingerprint needs a secret. That is signing.',
  ],
  signing: [
    'Signing adds a tag that only someone with a key can create.',
    'HMAC: Alice and the bank share a secret key and compute a tag over the message.',
    'The bank recomputes the tag. A match means intact and from a key holder.',
    'Eve changes 500 to 900. Without the key she cannot make a matching tag.',
    'The message itself is still readable. Signing gives trust, not secrecy.',
    'A digital signature uses a key pair: the private key signs, the public key verifies.',
    'Anyone can verify, only the owner can sign. That is how updates are trusted.',
  ],
  encryption: [
    'Encryption scrambles the message so only a key holder can read it.',
    'Plaintext goes in with a secret key and a nonce. Ciphertext comes out.',
    'Eve sees only 1e86c756…. Without the key it is noise.',
    'Decryption runs it backwards with the same key and recovers the text.',
    'A wrong key gives nothing useful. Here it fails authentication.',
    'This is symmetric encryption: one key for both directions.',
    'The catch: how do Alice and the bank share that key safely?',
  ],
  'key-pairs': [
    'Asymmetric encryption uses two keys that belong together.',
    'The public key can be shared with the world. The private key never leaves its owner.',
    "Alice encrypts with the bank's public key. Only the bank's private key can decrypt.",
    'Signing flips the roles: sign with the private key, verify with the public key.',
    'Public key maths is slow, so HTTPS uses it to agree on a fast symmetric key.',
    'Then the data flows under AES. This mix is called hybrid encryption.',
  ],
  combining: [
    'Real systems combine the tools. Each one covers a different gap.',
    'AES-GCM encrypts and adds an authentication tag in one step.',
    'HTTPS: a signed certificate proves the server, then encryption hides the data.',
    'A JWT is encoded and signed. An encrypted JWT is a different format, called JWE.',
    'Passwords are not encrypted. They are hashed with a slow, salted function.',
  ],
  'mix-ups': [
    'Myth: Base64 is encryption. Truth: anyone can decode it.',
    'Myth: a hash is encrypted data. Truth: it cannot be reversed, and it is not a secret.',
    'Myth: signed means secret. Truth: signed data is readable.',
    'Myth: encrypted means unchangeable. Use an authenticated mode like AES-GCM.',
    'Myth: encode it twice to be safe. Truth: encoding twice is still encoding.',
  ],
  recap: [
    'Encoding is format. Hashing is a fingerprint.',
    'Signing is trust. Encryption is secrecy.',
    'Pick the tool for the problem you actually have.',
  ],
} as const;
