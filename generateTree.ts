interface StoreActionProperties {
  [key: string]: any
}

interface SelectedValues {
  id: string
  labelValue: string
}

type State = SelectedValues[]

/**
 * Стор отвечающий за хранение данных о выбранных узлах,
 * без обработки подписок на изменение состояния
 */

const createStore = (reducer: (state: State, action: StoreActionProperties) => State, initialState: State) => {
  let state: State = initialState
  return {
    dispatch: action => state = reducer(state, action),
    getState: () => state,
  }
}

/**
 * Обработка кейса изменения состояния
 * @param state
 * @param action
 */
const selectedValuesReduce = (state: State, action: StoreActionProperties): State => {
  switch (action.type) {

    case 'CHECK_VALUE': {
      if (state.some(selected => selected.labelValue === action?.labelValue)) {

        //изменение состояния отображаемой структуры,
        // плохо масштабируемый вариант,стоило сделать флоу через подписку на состояние
        action.button.setAttribute("class", 'btnSelect')

        //изменение состояния
        return state.filter(selectedValues => selectedValues.id !== action.id)
      }

      //изменение состояния отображаемой структуры
      action.button.setAttribute("class", 'btnSelectDisabled')

      return [...state, {id: action.id, labelValue: action?.labelValue}]

    }
    default:
      return state
  }
}

const initialSelectedValues = []

const store = createStore(selectedValuesReduce, initialSelectedValues)

/**
 * Интерфейс SelectorStructure позволяет описывать рекурсивные структуры,
 * это необходимо для принятия на вход данных любой вложенности
 */
interface SelectorStructure {
  readonly id: string,
  readonly labelValue: string,
  readonly nestedStructure?: SelectorStructure[]
  checked: boolean
}

/**
 * Мок структуры для построения древовидного селектора,
 * структура может иметь N-вложенность,конкретный пример - вложенность 3
 */
const mockDataStructure: SelectorStructure = {
  id: 'root',
  labelValue: "Наши фирмы",
  checked: false,
  nestedStructure: [
    {
      id: "935737",
      labelValue: "Рога и Копыта",
      checked: false,
      nestedStructure: [
        {
          id: "1235515",
          labelValue: "Продукция",
          checked: false,
          nestedStructure: [
            {
              id: "5135",
              labelValue: "Мыло",
              checked: false,
            },
            {
              id: "7733",
              labelValue: "Ракеты космос-космос",
              checked: false
            }
          ]
        },
        {
          id: "26646357",
          labelValue: "Сотрудники",
          checked: false,
          nestedStructure: [
            {
              id: "125576702",
              labelValue: "Иванов",
              checked: false,
            },
            {
              id: "963579",
              labelValue: "Петров",
              checked: false,
            }
          ]
        }
      ]
    }
  ]
}

/**
 * функция-алгоритм построения древовидного селектора,
 * принимает на вход структуру для отображения и узел на странице - точку для отображения
 * @param structure
 * @param elementId
 */
const createTree = (structure: SelectorStructure, elementId: string) => {

  if (!structure.id) return
  //Каждый узел генерируемого html дерева есть UL,
  // даже замыкающие,поскольку возможно дальнейшее расширение
  //UPD: select не позволяет вложенность в себе еще одного select,решается с помощью optgroup,но макс вложенность будет тогда 2
  const selectGroup = document.createElement("ul")
  selectGroup.setAttribute("id", structure.id)
  //Для всех узлов кроме корневого добавляем класс необходимый в дальнейшем в процессе 'схлопывания'
  if (structure.id !== 'root') selectGroup.setAttribute("class", " accordion")

  //В каждый узел структуры добавляем элемент взаимодействия - кнопку с подпиской
  // на изменение состояния хранилища
  if (!structure.nestedStructure) {
    const selectButton = document.createElement('button')
    selectButton.setAttribute("class", 'btnSelect')
    selectButton.addEventListener('click', () => {

      store.dispatch({
        type: "CHECK_VALUE",
        id: structure.id,
        labelValue: structure.labelValue,
        button: selectButton
      })

      //обновление значение выводимого текстового поля
      const input = <HTMLInputElement>document.getElementById("inputValues");
      input.value = store.getState().map(selected => selected.labelValue).join(', ')

    })
    selectGroup.appendChild(selectButton)
  } else {
    const selectButton = document.createElement('button')
    selectButton.setAttribute("class", 'btnCategory')
    selectGroup.appendChild(selectButton)
  }


  if (structure.nestedStructure) {
    const hideButton = document.createElement('button')
    hideButton.setAttribute("class", 'labelHiddenButton')

    hideButton.addEventListener("click", () => {

      if (hideButton.classList.contains("labelHiddenButton")) {
        hideButton.setAttribute("class", 'labelHiddenButtonDisabled')
      } else hideButton.setAttribute("class", 'labelHiddenButton')

      //выносим коллекцию дочерних элементов для того,чтобы единожды вызывать метод .children
      const collection = selectGroup.children;

      //обрабатываем процесс 'схлопывания' подузла дерева
      for (let i = 0; i < collection.length; i++)
        if (collection[i].tagName === 'UL')
          if (collection[i].classList.contains('accordion'))
            collection[i].setAttribute("class", "accordionHidden")
          else collection[i].setAttribute("class", "accordion")
    })
    //внедряем элемент-кнопку скрытия в узел
    selectGroup.appendChild(hideButton)
  }

  //Объявляем текст узла
  selectGroup.appendChild(document.createTextNode(structure.labelValue))

  //Внедряем полученный каскад в дерево
  document.getElementById(elementId).appendChild(selectGroup);

  //Продолжаем построение дерева итеративно-рекурсивно для каждого вложенного элемента
  structure.nestedStructure?.map(nestedStructure => createTree(nestedStructure, structure.id))
}

//строим дерево в узле с id htmlRoot
createTree(mockDataStructure, 'htmlRoot')



