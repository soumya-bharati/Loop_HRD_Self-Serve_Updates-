import styled from 'styled-components'

import { assets } from '@/assets/figma'
import type { ResolvedAttributeField } from '@/domain/flex'

export function DynamicAttributeForm({
  fields,
  values,
  onChange,
  errors = {},
  title = 'Additional details',
}: {
  fields: ResolvedAttributeField[]
  values: Record<string, string>
  onChange: (id: string, value: string) => void
  errors?: Record<string, string>
  title?: string
}) {
  const visible = fields.filter((field) => field.visible)
  if (visible.length === 0) return null

  return (
    <Section>
      <Title>{title}</Title>
      <Grid>
        {visible.map(({ definition, requiredForLabel }) => (
          <Field key={definition.id}>
            <Label>
              {definition.label}
              {definition.required ? <Required>*</Required> : null}
            </Label>
            {definition.allowedValues?.length ? (
              <SelectWrap>
                <Control
                  as="select"
                  $placeholder={!values[definition.id]}
                  value={values[definition.id] ?? ''}
                  onChange={(event) =>
                    onChange(definition.id, event.target.value)
                  }
                >
                  <option value="">Select</option>
                  {definition.allowedValues.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Control>
                <SelectChevron
                  src={assets.chevronDown}
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden
                />
              </SelectWrap>
            ) : (
              <Control
                type={
                  definition.id.includes('date') ||
                  definition.id.includes('marriage')
                    ? 'date'
                    : 'text'
                }
                value={values[definition.id] ?? ''}
                onChange={(event) =>
                  onChange(definition.id, event.target.value)
                }
              />
            )}
            {requiredForLabel ? <Hint>{requiredForLabel}</Hint> : null}
            {errors[definition.id] ? (
              <ErrorText>{errors[definition.id]}</ErrorText>
            ) : null}
          </Field>
        ))}
      </Grid>
    </Section>
  )
}

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.textError};
`

const Control = styled.input<{ $placeholder?: boolean }>`
  width: 100%;
  height: 48px;
  padding: 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme, $placeholder }) =>
    $placeholder ? theme.colors.textSecondary : theme.colors.textPrimary};
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:is(select) {
    padding-right: 48px;
    appearance: none;
    cursor: pointer;
  }
`

const SelectWrap = styled.div`
  position: relative;
`

const SelectChevron = styled.img`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  pointer-events: none;
`

const Hint = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ErrorText = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textError};
`
