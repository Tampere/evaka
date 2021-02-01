import { Selector, t } from 'testcafe'
import { ApplicationType } from '@evaka/lib-common/src/api-types/application/enums'

export default class CitizenNewApplicationPage {
  readonly title = Selector('h1')
  readonly submit = Selector('[data-qa="submit"]')

  async selectType(type: ApplicationType) {
    await t.click(Selector(`[data-qa="type-radio-${type}"]`))
  }

  async createApplication(type: ApplicationType) {
    await this.selectType(type)
    await t.click(this.submit)
  }
}
