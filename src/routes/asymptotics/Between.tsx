import { TFunction } from "i18next"
import random, { RNGFactory } from "random"
import { ReactElement, ReactNode, useState } from "react"
import { Trans } from "react-i18next"
import math, { getVars } from "../../utils/math"
import {
  QuestionContainer,
  QuestionFooter,
  QuestionHeader,
} from "../../components/BasicQuizQuestions"
import TeX from "../../components/TeX"
import {
  mathNodeToSumProductTerm,
  sampleTermSet,
  SumProductTerm,
  TermSetVariants,
  TooComplex,
} from "../../utils/AsymptoticTerm"
import playSound from "../../effects/playSound"

/**
 * Generate and render a question about O/Omega/o/omega
 *
 * @returns {ReactElement} Output
 */

export default function Between({
  seed,
  variant,
  t,
  onResult,
  regenerate,
}: {
  seed: string
  variant: string
  t: TFunction
  onResult: (result: "correct" | "incorrect" | "abort") => void
  regenerate?: () => void
}): ReactElement {
  const permalink = Between.path + "/" + variant + "/" + seed
  random.use(RNGFactory(seed))
  const [text, setText] = useState("")
  const [savedMode, setMode] = useState(
    "disabled" as "disabled" | "verify" | "correct" | "incorrect"
  )

  const functionName = random.choice("fghFGHT".split("")) as string
  const variable = random.choice("nmNMxyztk".split("")) as string
  const [a, b] = sampleTermSet({
    variable,
    numTerms: 2,
    variant: variant as TermSetVariants,
  })
  let aLandau, bLandau
  if (a.compare(b) < 0) {
    aLandau = "\\omega"
    bLandau = "o"
  } else {
    aLandau = "o"
    bLandau = "\\omega"
  }

  const functionDeclaration = `${functionName}\\colon\\mathbb N\\to\\mathbb R`
  const aTeX = `${aLandau}(${a.toLatex()})`
  const bTeX = `${bLandau}(${b.toLatex()})`

  let parsed: SumProductTerm
  let textFeedback: ReactNode = "please enter an expression"
  let feedbackType: "ok" | "error" = "error"
  if (text) {
    try {
      const expr = math.parse(text)
      const unknownVars = getVars(expr).filter((v) => v !== variable)
      const unknownVar: string | null =
        unknownVars.length > 0 ? unknownVars[0] : null
      if (unknownVar) {
        feedbackType = "error"
        textFeedback = (
          <>
            Unknown variable: <TeX>{unknownVar}</TeX>. Expected:{" "}
            <TeX>{variable}</TeX>.
          </>
        )
      } else {
        feedbackType = "ok"
        textFeedback = (
          <TeX>
            {expr.toTex({
              parenthesis: "auto",
              implicit: "show",
            })}
          </TeX>
        )
        try {
          parsed = mathNodeToSumProductTerm(expr)
        } catch (e) {
          if (e instanceof TooComplex) {
            textFeedback = (
              <>Your expression is too complex, try a simpler one!</>
            )
            feedbackType = "error"
          } else {
            throw e
          }
        }
      }
    } catch (e) {
      textFeedback = "unable to parse your expression"
      feedbackType = "error"
    }
  }
  const msgColor =
    feedbackType === "error"
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-400"

  const title = t(Between.title)
  const mode =
    feedbackType === "error"
      ? "disabled"
      : savedMode === "disabled"
      ? "verify"
      : savedMode
  const message =
    mode === "correct" ? (
      <b className="text-2xl">Correct!</b>
    ) : mode === "incorrect" ? (
      <>
        <b className="text-xl">Possible correct solution:</b>
        <br />
        TODO
      </>
    ) : null
  function handleClick() {
    if (mode === "disabled") {
      setMode("verify")
    } else if (mode === "verify") {
      if (textFeedback === null || feedbackType === "error") return
      if (
        parsed.compare(a.toSumProductTerm()) *
          parsed.compare(b.toSumProductTerm()) <
        0
      ) {
        playSound("pass")
        setMode("correct")
      } else {
        playSound("fail")
        setMode("incorrect")
      }
    } else if (mode === "correct" || mode === "incorrect") {
      onResult(mode)
    }
  }
  const condA = `${functionName}(${variable}) \\in ${aTeX}`
  const condB = `${functionName}(${variable}) \\in ${bTeX}`
  return (
    <QuestionContainer>
      <QuestionHeader
        title={title}
        regenerate={regenerate}
        permalink={permalink}
      />
      <Trans t={t} i18nKey="asymptotics.between.text">
        Enter a function <TeX>{{ functionDeclaration } as any}</TeX> that
        satisfies <TeX block>{{ condA } as any}</TeX> and{" "}
        <TeX block>{{ condB } as any}</TeX>
      </Trans>
      <br />
      <br />
      <div className="flex place-items-center gap-2 pl-3">
        <TeX>
          {functionName}({variable})=
        </TeX>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleClick()
          }}
        >
          <input
            type="text"
            onChange={(e) => {
              setText(e.target.value)
            }}
            value={text}
            className="rounded-md bg-gray-300 p-2 dark:bg-gray-900"
            disabled={mode === "correct" || mode === "incorrect"}
          />
        </form>
        <div className={msgColor}>{textFeedback}</div>
      </div>
      <div className="p-5 text-slate-600 dark:text-slate-400">
        <Trans t={t} i18nKey="asymptotics.between.note">
          Note: This text field accepts <i>simple</i> mathematical expressions,
          such as
        </Trans>{" "}
        &ldquo;<span className="font-mono">96n^3</span>&rdquo;, &ldquo;
        <span className="font-mono">n log(n)</span>&rdquo;, {t("or")} &ldquo;
        <span className="font-mono">n^(2/3)</span>&rdquo;.
      </div>
      <QuestionFooter mode={mode} message={message} buttonClick={handleClick} />
    </QuestionContainer>
  )
}
Between.variants = ["start", "polylog"]
Between.path = "asymptotics/between"
Between.title = "asymptotics.between.title"