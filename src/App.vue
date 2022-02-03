<template>
  <div class="center">
    <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no" />

    <div id="checkArea">
      <span class="char" v-for="(char, index) in chars" :key="index">
        {{ char }}
      </span>
    </div>
    <h4 v-if="wordObject" class="phoneticSymbols">{{ wordObject.trans }}</h4>
    <input v-if="showInput" type="text" v-model="text" placeholder="请输入上述单词" :maxlength="charsLength" />
    <div>
      美音：<input type="radio" value="0" v-model="type" @change="changeVoice" />
      英音：<input type="radio" value="1" v-model="type" @change="changeVoice" />
    </div>
    <h5 v-if="wordObject" class="phoneticSymbols">
      US：{{ wordObject.usphone }}
    </h5>
    <h5 v-if="wordObject" class="phoneticSymbols">
      UK：{{ wordObject.ukphone }}
    </h5>
    <div>
      <input v-model.number="wordIndex" ref="wordIndex" type="number" maxlength="5" style="width: 60px"
        @change="setWordIndex" @blur="setWordIndex" />
      /{{ total }}
    </div>

    <select v-model="dictionary" ref="selector" @change="changeDictionary">
      <option v-for="option in dictionaries" :value="option.value" :key="option.value">
        {{ option.text }}
      </option>
    </select>

    <span v-if="showTip">按下回车 开始！</span>
    <audio ref="audio" :src="audioUrl" @canplay="ready" :hidden="true"></audio>

    <div v-show="showQwerty">
      <br />
      <p style="color: red; font-size: larger">
        个人仿制项目，背单词自用
        <br />
        建议点击图片 访问原版！⬇️
        <br />
        （该提示 5 秒后消失）
      </p>
      <img src="./assets/qwerty.png" width="100" @click="openQwertyUrl" />
    </div>

    <br />
    <br />
    <div v-html="example"></div>
  </div>
</template>

<script>
  const LAST_DICTIONARY_KEY = "lastDictionary";
  const DICTIONARY_WORD_INDEX_PREFIX = "dictionary_";

  const dictionaries = [
    { text: "CET-4", value: "CET4_T" },
    { text: "CET-6", value: "CET6_T" },
    { text: "GMAT", value: "GMAT_3_T" },
    { text: "GRE", value: "GRE_3_T" },
    { text: "IELTS", value: "IELTS_3_T" },
    { text: "考研", value: "KaoYan_3_T" },
    { text: "专四", value: "Level4luan_2_T" },
    { text: "专八", value: "Level8luan_2_T" },
    { text: "SAT", value: "SAT_3_T" },
    { text: "TOEFL", value: "TOEFL_3_T" },
    { text: "商务英语", value: "BEC_2_T" },
    { text: "BEC", value: "BEC_3_T" },
  ];

  const defaultDictionary = "CET4_T";

  let wordObjects = new Array();
  let words = new Array();
  let wordIndex = 0;
  let wordObject;

  let chars = new Array();
  let charIndex = 0;

  export default {
    name: "App",
    data() {
      return {
        example: "",
        showQwerty: true,
        wordObjects,
        words,
        wordIndex,
        wordObject,
        charIndex,
        chars,
        dictionaries,
        dictionary: defaultDictionary,
        showTip: true,
        showInput: false,
        text: "",
        audioUrl: "",
        audioReady: false,
        type: 0,
      };
    },
    computed: {
      total() {
        return this.wordObjects.length;
      },
      charsLength() {
        return this.chars.length;
      },
    },
    methods: {
      getExample() {
        let word = this.words[this.wordIndex];
        this.axios.get("https://huhuhahaka.cn/example/" + word).then((response) => {
          this.example = response.data;
        });
      },
      openQwertyUrl() {
        window.open("https://qwerty.liumingye.cn/");
      },
      setWordIndex() {
        let charElements = document.querySelectorAll("#checkArea .char");
        this.reset(charElements);

        this.$refs.wordIndex.blur();
        let newWordIndex = this.wordIndex;
        if (newWordIndex < 0 || newWordIndex == "") {
          newWordIndex = 0;
        }

        this.setAboutWord(newWordIndex);
        this.playing();
        this.getExample();
      },
      changeVoice() {
        this.playing();
      },
      changeDictionary() {
        this.$refs.selector.blur();

        localStorage.setItem(LAST_DICTIONARY_KEY, this.dictionary);
        this.axios.get("/" + this.dictionary + ".json").then((response) => {
          this.setAboutWords(response);

          // 重置
          let charElements = document.querySelectorAll("#checkArea .char");
          this.reset(charElements);

          // 根据 localStorage 更新显示
          let myWordIndex = localStorage.getItem(
            DICTIONARY_WORD_INDEX_PREFIX + this.dictionary
          );
          if (myWordIndex == null) {
            myWordIndex = 0;
          }
          this.setAboutWord(myWordIndex);
          this.playing();
          this.getExample();
        });
      },
      async ready() {
        this.audioReady = true;
        return true;
      },
      splitWord(word) {
        this.chars = word.split("");
      },
      //键盘录入字符校验
      checkChar(inputChar) {
        let index = this.charIndex;

        if (this.chars[index] == inputChar) {
          this.processing(index, true);
        } else {
          this.processing(index, false);
        }
      },
      //录入正确或错误 调整样式
      processing(index, rightOrWrong) {
        //todo 需要优化一下 不要每次输入都执行
        let charElements = document.querySelectorAll("#checkArea .char");

        if (this.showInput) {
          // 手机端 文字校验样式处理
          let tempText = this.text;
          let tempTextChars = tempText.split("");
          charElements.forEach((e, index) => {
            if (index < tempText.length) {
              if (tempTextChars[index] == this.chars[index]) {
                e.style.color = "green";
              } else {
                e.style.color = "red";
              }
            } else {
              e.style.color = "lightgray";
            }
          });

          if (tempText == this.wordObjects[this.wordIndex].name) {
            this.nextWord(charElements);
          }
        } else {
          if (rightOrWrong) {
            charElements[index].style.color = "green";

            this.nextWord(charElements);
          } else {
            if (index > this.chars.length - 1) {
              return;
            }
            charElements[index].style.color = "red";
            setTimeout(() => {
              this.reset(charElements);
              // this.playing();
            }, 500);
          }
        }
      },
      reset(charElements) {
        charElements.forEach((e) => {
          e.style.color = "lightgray";
        });
        this.charIndex = 0;
      },
      nextWord(charElements) {
        if (++this.charIndex >= this.chars.length) {
          this.text = "";
          let nextWordIndex = ++this.wordIndex;

          //展示例句
          this.getExample();

          if (nextWordIndex > this.words.length - 1) {
            this.reset(charElements);
            this.wordIndex = this.words.length - 1;
            alert("恭喜练习完成!");
            return;
          }

          setTimeout(() => {
            this.reset(charElements);
            this.setAboutWord(nextWordIndex);
            this.playing();
          }, 500);
        }
      },
      playing() {
        this.ready()
          .then(() => {
            let type = this.type;
            let word = this.words[this.wordIndex];
            this.audioUrl = `https://dict.youdao.com/dictvoice?type=${type}&audio=${word}`;
          })
          .then(() => {
            this.$refs.audio.play();
            this.audioReady = false;
          });
      },
      isMobile() {
        let flag = navigator.userAgent.match(
          /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
        );
        return flag;
      },
      setAboutWords(response) {
        this.wordObjects = response.data;
        this.words = this.wordObjects.map((item) => {
          return item.name;
        });
      },
      setAboutWord(wordIndex) {
        if (wordIndex >= this.words.length) {
          wordIndex = this.words.length - 1;
        }
        localStorage.setItem(
          DICTIONARY_WORD_INDEX_PREFIX + this.dictionary,
          wordIndex
        );

        let word = this.words[wordIndex];
        if (word != undefined) {
          this.wordIndex = wordIndex;
          this.splitWord(word);
          this.wordObject = this.wordObjects[wordIndex];
        }
      },
      isShowInput() {
        if (this.isMobile()) {
          this.showInput = true;
          return true;
        }
        return false;
      }
    },
    watch: {

    },
    mounted() {

    },
    created() {
      this.isShowInput();

      setTimeout(() => {
        this.showQwerty = false;
      }, 5000);

      let lastDictionary = localStorage.getItem(LAST_DICTIONARY_KEY);
      if (lastDictionary == null) {
        lastDictionary = defaultDictionary;
      }

      this.dictionary = lastDictionary;
      this.axios.get("/" + lastDictionary + ".json").then((response) => {
        this.setAboutWords(response);
        let myWordIndex = localStorage.getItem(
          DICTIONARY_WORD_INDEX_PREFIX + lastDictionary
        );
        if (myWordIndex == null) {
          myWordIndex = 0;
        }

        this.setAboutWord(myWordIndex);

        this.getExample();
        document.onkeyup = (e) => {
          this.showTip = false;

          let inputChar;
          if (this.showInput) {
            let tempText = this.text;
            if (tempText == "") {
              let charElements = document.querySelectorAll("#checkArea .char");
              this.reset(charElements);
              return;
            }
            let tempIndex = tempText.length - 1;
            inputChar = tempText.charAt(tempIndex);

            this.charIndex = tempIndex;
          } else {
            inputChar = e.key;
          }

          if (inputChar == "Enter") {
            this.playing();
          } else if (inputChar == "Shift" || inputChar == "CapsLock") {
            //do nothing
          } else {
            this.checkChar(inputChar);
          }
        };
      });
    },
  };
</script>

<style scoped>
  .center {
    text-align: center;
  }

  .char {
    margin: 0 1px;
    font-size: 50px;
    color: lightgray;
  }

  .phoneticSymbols {
    font-family: "Palatino Linotype", "Book Antiqua", Palatino, serif;
  }
</style>