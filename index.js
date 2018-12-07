// https://www.smashingmagazine.com/2018/01/automated-testing/

let webdriver = require('selenium-webdriver');
let expect = require('chai').expect;
let path = require('path');

describe('Run four tests against TODOMVC sample', function () {
  process.env.path = `${process.env.path};${__dirname};`;

  let capabilities = {
    'browserName': 'chrome',
    'build': 'BrowserStack Automate'
  };
  let toDoTestItems = ["Browser Stare", "Learn Chai", "Integrate Mocha"];
  let entrytoEdit = toDoTestItems[0];

  let browser = new webdriver.Builder()
                             .usingServer()
                             .withCapabilities(capabilities)
                             .build();

  before(async () => {
    // Указываем браузеру страницу, на которую нужно переместиться
    await browser.get('http://todomvc.com/examples/react/#');
    // Ожидаем завершения загрузки данных
    await browser.manage().setTimeouts({ implicit: 1000, pageLoad: 1000, script: 1000 })
    // Находим элемент, в который нужно вводить данные для добавления задач в TODO
    let todoEntry = await browser.findElement(webdriver.By.css('.new-todo'));
    // Вводим данные
    for (let item of toDoTestItems) {
      await todoEntry.sendKeys(item);
      await todoEntry.sendKeys("\n");
    }
  });

  // const title = await browser.getTitle();
  // console.log(title);

  describe('Initial tests', () => {
    it('TEST 1: Query the page for TODO items and test they match what was sent', async () => {
      // Смотрим на значения, которые были введены в TODO list, получая коллекцию веб элементов
      // Для этого используем иструмент в WebDrivers, предназначенный для сопоставления CSS-стилей
      // Элементы списка имеют CSS свойства todo-list и label
      let testElements = await browser.findElements(webdriver.By.css('.todo-list label'));
      console.log('Found', testElements.length, 'ToDo items.');

      // Убедимся, что количество элементов не равно нулю
      expect(testElements).to.not.have.lengthOf(0);
      // Убедимся, что элементов ровно столько, сколько мы вводили
      expect(testElements.length).to.equal(toDoTestItems.length);

      // Пройдемся по элементам коллекции, чтобы убедится, что введеный текст соответствует содержимому элемента
      for (let i = 0; i < testElements.length; i++) {
        let text = await testElements[i].getText();
        expect(text).to.equal(toDoTestItems[i]);
      }
    });

    it('TEST 2: Edit a TODO and validate it matches what was typed', async () => {
      let testElements = await browser.findElements(webdriver.By.css('.todo-list label'));
      let newText = "ack";
      let numBackSpaces = 3;
      let modifiedText = entrytoEdit.slice(0, entrytoEdit.length - numBackSpaces) + newText;
      // Перемещаем курсор мыши на первый элемент TODO списка
      await browser.actions({bridge: true}).move({origin: testElements[0]}).perform();
      // Выполняем двойной клик мыши
      await browser.actions({bridge: true}).doubleClick().perform();
      // В результате будет создано новое поле для ввода данных. Получим это поле 
      let editableItem = await browser.findElement(webdriver.By.css('.todo-list input.edit'));
      // Удаляем по 1 символу
      for (let i = 0; i < numBackSpaces; i++) {
        await editableItem.sendKeys('\b');
      }
      // Добавляем текст
      await editableItem.sendKeys(newText);
      await editableItem.sendKeys('\n');
      // После того, как были внесены изменения, обновляем имеющиеся данные
      let updatedItems = await browser.findElements(webdriver.By.css('.todo-list label'));
      let newFirstItem = await updatedItems[0].getText();
      // Проверяем введенное значение
      expect(newFirstItem).equals(modifiedText);
    });

    it('TEST 3: Delete a TODO item from the list by clicking the X button', async () => {
      let updatedItems = await browser.findElements(webdriver.By.css('.todo-list label'));
      // Находим кнопки для удаления элементов
      let destroyButtons = await browser.findElements(webdriver.By.css('.todo-list .destroy'));
      console.log("Found " + destroyButtons.length + " destroy class items");
      // Перемещаем курсор мыши на первую кнопку
      await browser.actions({bridge: true}).move({origin: destroyButtons[0]}).perform();
      // Выполняем клик
      await browser.actions({bridge: true}).click().perform();
      // Снова получаем список элементов после очередного обновления
      const updatedItemsPostDelete = await browser.findElements(webdriver.By.css('.todo-list label'));
      // Сравниваем количество
      expect(updatedItemsPostDelete.length).to.equal(updatedItems.length - 1);
    });

    it('TEST 4: Mark an item as complete and test the number of items has reduced by 1', async () => {
      // Сначала находим элемент, в котором указано количество элементов в TODO
      let itemsLeft = await browser.findElement(webdriver.By.css('.todo-count strong'));
      let countItemsLeft = await itemsLeft.getText();
      console.log("Currently there are " + countItemsLeft + " items left");
      // Находим чекбоксы
      let toggleCheckBoxes = await browser.findElements(webdriver.By.css('.todo-list .toggle'));
      console.log("found " + toggleCheckBoxes.length + " check boxes");
      // Помечаем задачу как выполненную, нажимая на чекбокс
      await browser.actions({bridge: true}).move({origin: toggleCheckBoxes[0]}).perform();
      await browser.actions({bridge: true}).click().perform();
      // После этого задача должна быть помечена как выполненная и количество оставшихся элементов должно уменьшится на 1
      let currentItemsLeft = await browser.findElement(webdriver.By.css('.todo-count strong'));
      let countCurrentItemsLeft = await currentItemsLeft.getText();
      expect(parseInt(countCurrentItemsLeft)).to.equal((parseInt(countItemsLeft)) - 1);
      // Завершаем работу браузера
      await browser.quit();
    });
  });
});
